import {NextRequest, NextResponse} from 'next/server'
import {beforeEach, describe, expect, it, vi} from 'vitest'

// Mock dependencies before imports
vi.mock('@/lib/utils/env', () => ({
  isProduction: vi.fn(() => false),
  getCookieDomain: vi.fn(() => undefined)
}))

vi.mock('@/lib/datadog/server', () => ({
  logger: {
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }
}))

const mockState = 'mock-state-abc123'
const mockUrl = new URL(
  `https://reddit.com/api/v1/authorize?state=${mockState}&scope=identity+read+vote+subscribe+mysubreddits+save+submit+edit+history&duration=permanent`
)

vi.mock('@/lib/utils/reddit-auth', () => ({
  createLoginUrl: vi.fn(async () => ({url: mockUrl, state: mockState}))
}))

// Import after mocks
import {logger} from '@/lib/datadog/server'
import {getCookieDomain, isProduction} from '@/lib/utils/env'
import {resetRateLimitsForTests} from '@/lib/utils/rate-limit'
import {createLoginUrl} from '@/lib/utils/reddit-auth'
import {GET} from './route'

const mockCreateLoginUrl = vi.mocked(createLoginUrl)
const mockIsProduction = vi.mocked(isProduction)
const mockGetCookieDomain = vi.mocked(getCookieDomain)
const mockLogger = vi.mocked(logger)

function makeRequest(ip = '203.0.113.1'): NextRequest {
  return new NextRequest('https://example.com/api/auth/login', {
    headers: {'x-forwarded-for': ip}
  })
}

describe('GET /api/auth/login', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetRateLimitsForTests()
    mockIsProduction.mockReturnValue(false)
    mockGetCookieDomain.mockReturnValue(undefined)
    mockCreateLoginUrl.mockResolvedValue({url: mockUrl, state: mockState})
  })

  it('redirects to the URL returned by createLoginUrl', async () => {
    const response = await GET(makeRequest())

    expect(response).toBeInstanceOf(NextResponse)
    const location = response.headers.get('location')
    expect(location).toBe(mockUrl.toString())
  })

  it('redirect URL contains duration=permanent', async () => {
    const response = await GET(makeRequest())

    const location = response.headers.get('location')
    expect(location).toContain('duration=permanent')
  })

  it('redirect URL contains all required scopes', async () => {
    const response = await GET(makeRequest())

    const location = response.headers.get('location')
    expect(location).toBeTruthy()
    const url = new URL(location!)
    const scopeParam = url.searchParams.get('scope') ?? ''

    for (const scope of [
      'identity',
      'read',
      'vote',
      'subscribe',
      'mysubreddits',
      'save',
      'submit',
      'edit',
      'history'
    ]) {
      expect(scopeParam).toContain(scope)
    }
  })

  it('sets state cookie from createLoginUrl result', async () => {
    const response = await GET(makeRequest())

    const cookies = response.cookies.getAll()
    const stateCookie = cookies.find((c) => c.name === 'reddit_oauth_state')

    expect(stateCookie).toBeDefined()
    expect(stateCookie?.value).toBe(mockState)
  })

  it('sets state cookie without secure flag in development', async () => {
    mockIsProduction.mockReturnValue(false)

    const response = await GET(makeRequest())

    const cookies = response.cookies.getAll()
    const stateCookie = cookies.find((c) => c.name === 'reddit_oauth_state')
    expect(stateCookie).toBeDefined()
    expect(stateCookie?.value).toBe(mockState)
  })

  it('sets state cookie with secure flag in production', async () => {
    mockIsProduction.mockReturnValue(true)

    const response = await GET(makeRequest())

    const cookies = response.cookies.getAll()
    const stateCookie = cookies.find((c) => c.name === 'reddit_oauth_state')
    expect(stateCookie).toBeDefined()
    expect(stateCookie?.value).toBe(mockState)
  })

  it('sets a 15 minute maxAge on the state cookie', async () => {
    const response = await GET(makeRequest())

    const cookies = response.cookies.getAll()
    const stateCookie = cookies.find((c) => c.name === 'reddit_oauth_state')
    expect(stateCookie?.maxAge).toBe(900)
  })

  it('omits the domain attribute when getCookieDomain returns undefined', async () => {
    mockGetCookieDomain.mockReturnValue(undefined)

    const response = await GET(makeRequest())

    const cookies = response.cookies.getAll()
    const stateCookie = cookies.find((c) => c.name === 'reddit_oauth_state')
    expect(stateCookie?.domain).toBeUndefined()
  })

  it('sets the domain attribute returned by getCookieDomain', async () => {
    mockIsProduction.mockReturnValue(true)
    mockGetCookieDomain.mockReturnValue('reddit-viewer.com')

    const response = await GET(makeRequest())

    const cookies = response.cookies.getAll()
    const stateCookie = cookies.find((c) => c.name === 'reddit_oauth_state')
    expect(stateCookie?.domain).toBe('reddit-viewer.com')
  })

  it('uses a different state for each call to createLoginUrl', async () => {
    const state1 = 'state-aaa'
    const state2 = 'state-bbb'
    const url1 = new URL(`https://reddit.com/authorize?state=${state1}`)
    const url2 = new URL(`https://reddit.com/authorize?state=${state2}`)

    mockCreateLoginUrl
      .mockResolvedValueOnce({url: url1, state: state1})
      .mockResolvedValueOnce({url: url2, state: state2})

    const response1 = await GET(makeRequest())
    const response2 = await GET(makeRequest())

    const location1 = response1.headers.get('location')
    const location2 = response2.headers.get('location')

    expect(location1).toContain(state1)
    expect(location2).toContain(state2)
    expect(location1).not.toBe(location2)
  })

  it('handles errors gracefully', async () => {
    mockCreateLoginUrl.mockRejectedValue(
      new Error('Arctic initialization failed')
    )

    const response = await GET(makeRequest())

    expect(response.status).toBe(500)
    expect(await response.text()).toBe('Failed to initiate login')
    expect(mockLogger.error).toHaveBeenCalledWith(
      'Failed to initiate OAuth login',
      expect.objectContaining({
        context: 'OAuthLogin',
        error: expect.any(String)
      })
    )
  })

  it('allows requests up to the rate limit', async () => {
    for (let i = 0; i < 10; i++) {
      const response = await GET(makeRequest('198.51.100.1'))
      expect(response.status).toBe(307)
    }
  })

  it('returns 429 once the rate limit is exceeded', async () => {
    const ip = '198.51.100.2'
    for (let i = 0; i < 10; i++) {
      await GET(makeRequest(ip))
    }

    const response = await GET(makeRequest(ip))

    expect(response.status).toBe(429)
    expect(await response.text()).toBe(
      'Too many login attempts. Please try again shortly.'
    )
    expect(response.headers.get('Retry-After')).toBeTruthy()
    expect(mockLogger.warn).toHaveBeenCalledWith(
      'App rate limit exceeded for /api/auth/login',
      expect.objectContaining({ip, context: 'OAuthLogin'})
    )
    expect(mockCreateLoginUrl).toHaveBeenCalledTimes(10)
  })

  it('tracks rate limits independently per IP', async () => {
    const ipA = '198.51.100.3'
    const ipB = '198.51.100.4'

    for (let i = 0; i < 10; i++) {
      await GET(makeRequest(ipA))
    }

    const responseA = await GET(makeRequest(ipA))
    const responseB = await GET(makeRequest(ipB))

    expect(responseA.status).toBe(429)
    expect(responseB.status).toBe(307)
  })
})
