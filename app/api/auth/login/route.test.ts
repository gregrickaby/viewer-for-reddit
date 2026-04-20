import {NextResponse} from 'next/server'
import {beforeEach, describe, expect, it, vi} from 'vitest'

// Mock dependencies before imports
vi.mock('@/lib/utils/env', () => ({
  isProduction: vi.fn(() => false)
}))

vi.mock('@/lib/axiom/server', () => ({
  logger: {
    info: vi.fn(),
    debug: vi.fn(),
    error: vi.fn()
  }
}))

const mockState = 'mock-state-abc123'
const mockUrl = new URL(
  `https://reddit.com/api/v1/authorize?state=${mockState}&scope=identity+read+vote+subscribe+mysubreddits+save+submit+edit+history&duration=permanent`
)

vi.mock('@/lib/reddit-auth', () => ({
  createLoginUrl: vi.fn(async () => ({url: mockUrl, state: mockState}))
}))

// Import after mocks
import {createLoginUrl} from '@/lib/reddit-auth'
import {logger} from '@/lib/axiom/server'
import {isProduction} from '@/lib/utils/env'
import {GET} from './route'

const mockCreateLoginUrl = vi.mocked(createLoginUrl)
const mockIsProduction = vi.mocked(isProduction)
const mockLogger = vi.mocked(logger)

describe('GET /api/auth/login', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsProduction.mockReturnValue(false)
    mockCreateLoginUrl.mockResolvedValue({url: mockUrl, state: mockState})
  })

  it('redirects to the URL returned by createLoginUrl', async () => {
    const response = await GET()

    expect(response).toBeInstanceOf(NextResponse)
    const location = response.headers.get('location')
    expect(location).toBe(mockUrl.toString())
  })

  it('redirect URL contains duration=permanent', async () => {
    const response = await GET()

    const location = response.headers.get('location')
    expect(location).toContain('duration=permanent')
  })

  it('redirect URL contains all required scopes', async () => {
    const response = await GET()

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
    const response = await GET()

    const cookies = response.cookies.getAll()
    const stateCookie = cookies.find((c) => c.name === 'reddit_oauth_state')

    expect(stateCookie).toBeDefined()
    expect(stateCookie?.value).toBe(mockState)
  })

  it('sets state cookie without secure flag in development', async () => {
    mockIsProduction.mockReturnValue(false)

    const response = await GET()

    const cookies = response.cookies.getAll()
    const stateCookie = cookies.find((c) => c.name === 'reddit_oauth_state')
    expect(stateCookie).toBeDefined()
    expect(stateCookie?.value).toBe(mockState)
  })

  it('sets state cookie with secure flag in production', async () => {
    mockIsProduction.mockReturnValue(true)

    const response = await GET()

    const cookies = response.cookies.getAll()
    const stateCookie = cookies.find((c) => c.name === 'reddit_oauth_state')
    expect(stateCookie).toBeDefined()
    expect(stateCookie?.value).toBe(mockState)
  })

  it('uses a different state for each call to createLoginUrl', async () => {
    const state1 = 'state-aaa'
    const state2 = 'state-bbb'
    const url1 = new URL(`https://reddit.com/authorize?state=${state1}`)
    const url2 = new URL(`https://reddit.com/authorize?state=${state2}`)

    mockCreateLoginUrl
      .mockResolvedValueOnce({url: url1, state: state1})
      .mockResolvedValueOnce({url: url2, state: state2})

    const response1 = await GET()
    const response2 = await GET()

    const location1 = response1.headers.get('location')
    const location2 = response2.headers.get('location')

    expect(location1).toContain(state1)
    expect(location2).toContain(state2)
    expect(location1).not.toBe(location2)
  })

  it('logs OAuth flow initiation', async () => {
    await GET()

    expect(mockLogger.info).toHaveBeenCalledWith(
      'OAuth login initiated',
      expect.objectContaining({
        state: expect.stringMatching(/^.{8}\.\.\.$/),
        context: 'OAuth'
      })
    )
  })

  it('handles errors gracefully', async () => {
    mockCreateLoginUrl.mockRejectedValue(
      new Error('Arctic initialization failed')
    )

    const response = await GET()

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
})
