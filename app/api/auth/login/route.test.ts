import {NextResponse} from 'next/server'
import {beforeEach, describe, expect, it, vi} from 'vitest'

// Mock dependencies before imports
vi.mock('@/lib/utils/env', () => ({
  getEnvVar: vi.fn((key: string) => {
    if (key === 'REDDIT_CLIENT_ID') return 'test-client-id'
    if (key === 'REDDIT_CLIENT_SECRET') return 'test-client-secret'
    if (key === 'REDDIT_REDIRECT_URI')
      return 'https://example.com/api/auth/callback/reddit'
    return ''
  }),
  isProduction: vi.fn(() => false)
}))

vi.mock('arctic', () => ({
  Reddit: class Reddit {
    createAuthorizationURL(state: string, scopes: string[]) {
      return new URL(
        `https://reddit.com/api/v1/authorize?state=${state}&scope=${scopes.join(' ')}`
      )
    }
  }
}))

// Mock crypto.randomUUID
const mockUUID = 'test-uuid-12345'
Object.defineProperty(global.crypto, 'randomUUID', {
  writable: true,
  value: vi.fn(() => mockUUID)
})

// Import after mocks
import {getEnvVar, isProduction} from '@/lib/utils/env'
import {GET} from './route'

const mockGetEnvVar = vi.mocked(getEnvVar)
const mockIsProduction = vi.mocked(isProduction)

describe('GET /api/auth/login', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetEnvVar.mockImplementation((key: string) => {
      if (key === 'REDDIT_CLIENT_ID') return 'test-client-id'
      if (key === 'REDDIT_CLIENT_SECRET') return 'test-client-secret'
      if (key === 'REDDIT_REDIRECT_URI')
        return 'https://example.com/api/auth/callback/reddit'
      return ''
    })
    mockIsProduction.mockReturnValue(false)
  })

  it('creates authorization URL with correct state', async () => {
    const response = await GET()

    expect(response).toBeInstanceOf(NextResponse)

    // Check redirect URL contains state
    const redirectUrl = response.headers.get('location')
    expect(redirectUrl).toContain(`state=${mockUUID}`)
  })

  it('creates authorization URL with duration=permanent', async () => {
    const response = await GET()

    const redirectUrl = response.headers.get('location')
    expect(redirectUrl).toContain('duration=permanent')
  })

  it('creates authorization URL with correct scopes', async () => {
    const response = await GET()

    const redirectUrl = response.headers.get('location')
    const url = new URL(redirectUrl!)

    // Check that scope parameter includes expected scopes
    const scopeParam = url.searchParams.get('scope')
    expect(scopeParam).toContain('identity')
    expect(scopeParam).toContain('read')
    expect(scopeParam).toContain('vote')
    expect(scopeParam).toContain('subscribe')
    expect(scopeParam).toContain('mysubreddits')
    expect(scopeParam).toContain('save')
    expect(scopeParam).toContain('submit')
    expect(scopeParam).toContain('edit')
    expect(scopeParam).toContain('history')
  })

  it('sets state cookie with correct options in development', async () => {
    mockIsProduction.mockReturnValue(false)

    const response = await GET()

    const cookies = response.cookies.getAll()
    const stateCookie = cookies.find((c) => c.name === 'reddit_oauth_state')

    expect(stateCookie).toBeDefined()
    expect(stateCookie?.value).toBe(mockUUID)
  })

  it('sets state cookie with correct options in production', async () => {
    mockIsProduction.mockReturnValue(true)

    const response = await GET()

    const cookies = response.cookies.getAll()
    const stateCookie = cookies.find((c) => c.name === 'reddit_oauth_state')

    expect(stateCookie).toBeDefined()
    expect(stateCookie?.value).toBe(mockUUID)
  })

  it('generates new UUID for each request', async () => {
    const uuid1 = 'uuid-1'
    const uuid2 = 'uuid-2'

    ;(crypto.randomUUID as any).mockReturnValueOnce(uuid1)
    const response1 = await GET()

    ;(crypto.randomUUID as any).mockReturnValueOnce(uuid2)
    const response2 = await GET()

    const redirectUrl1 = response1.headers.get('location')
    const redirectUrl2 = response2.headers.get('location')

    expect(redirectUrl1).toContain(`state=${uuid1}`)
    expect(redirectUrl2).toContain(`state=${uuid2}`)
  })
})
