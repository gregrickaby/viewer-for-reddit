import {beforeEach, describe, expect, it, vi} from 'vitest'

// Mock dependencies BEFORE module imports
vi.mock('@/lib/actions/auth', () => ({
  getValidAccessToken: vi.fn(
    async (session?: {accessToken?: string}) => session?.accessToken || null
  )
}))

vi.mock('@/lib/auth/session', () => ({
  getSession: vi.fn()
}))

vi.mock('@/lib/utils/env', () => ({
  getEnvVar: vi.fn((key: string) => {
    if (key === 'USER_AGENT') return 'test-user-agent/1.0'
    return ''
  })
}))

vi.mock('@/lib/axiom/server', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn()
  }
}))

vi.mock('next/headers', () => ({
  headers: vi.fn(async () => ({
    get: vi.fn(() => null)
  }))
}))

import {getSession} from '@/lib/auth/session'
import {getValidAccessToken} from '@/lib/actions/auth'
import {getHeaders, validateRedditUrl} from './_helpers'
import type {IronSession} from 'iron-session'
import type {SessionData} from '@/lib/types/reddit'

const mockGetSession = vi.mocked(getSession)
const mockGetValidAccessToken = vi.mocked(getValidAccessToken)

function createMockSession(
  data: Partial<SessionData> = {}
): IronSession<SessionData> {
  return {
    accessToken: data.accessToken || '',
    refreshToken: data.refreshToken || '',
    expiresAt: data.expiresAt || 0,
    username: data.username || '',
    userId: data.userId || '',
    save: vi.fn().mockResolvedValue(undefined),
    destroy: vi.fn(),
    updateConfig: vi.fn()
  } as IronSession<SessionData>
}

describe('getHeaders', () => {
  beforeEach(() => {
    mockGetSession.mockClear()
    mockGetValidAccessToken.mockClear()
  })

  it('returns unauthenticated context when no access token', async () => {
    mockGetSession.mockResolvedValue(createMockSession())

    const context = await getHeaders()

    expect(context.isAuthenticated).toBe(false)
    expect(context.username).toBeNull()
    expect(context.baseUrl).toBe('https://www.reddit.com')
    expect(
      (context.headers as Record<string, string>).Authorization
    ).toBeUndefined()
    expect((context.headers as Record<string, string>)['User-Agent']).toBe(
      'test-user-agent/1.0'
    )
  })

  it('returns authenticated context when a valid access token exists', async () => {
    mockGetSession.mockResolvedValue(
      createMockSession({accessToken: 'valid-token', username: 'testuser'})
    )

    const context = await getHeaders()

    expect(context.isAuthenticated).toBe(true)
    expect(context.username).toBe('testuser')
    expect(context.baseUrl).toBe('https://oauth.reddit.com')
    expect((context.headers as Record<string, string>).Authorization).toBe(
      'Bearer valid-token'
    )
  })

  it('returns username: null when session username is an empty string', async () => {
    mockGetSession.mockResolvedValue(
      createMockSession({accessToken: 'valid-token', username: ''})
    )

    const context = await getHeaders()

    expect(context.username).toBeNull()
  })

  it('calls getSession exactly once', async () => {
    mockGetSession.mockResolvedValue(createMockSession())

    await getHeaders()

    expect(mockGetSession).toHaveBeenCalledTimes(1)
  })

  it('passes the resolved session to getValidAccessToken', async () => {
    const session = createMockSession({accessToken: 'valid-token'})
    mockGetSession.mockResolvedValue(session)

    await getHeaders()

    expect(mockGetValidAccessToken).toHaveBeenCalledWith(session)
  })

  it('sets isAuthenticated based on getValidAccessToken result, not raw session token', async () => {
    // Session has a token, but getValidAccessToken returns null (e.g., expired, refresh failed)
    mockGetSession.mockResolvedValue(
      createMockSession({accessToken: 'stale-token'})
    )
    mockGetValidAccessToken.mockResolvedValueOnce(null)

    const context = await getHeaders()

    expect(context.isAuthenticated).toBe(false)
    expect(context.baseUrl).toBe('https://www.reddit.com')
  })

  it('returns User-Agent header in all contexts', async () => {
    mockGetSession.mockResolvedValue(createMockSession())

    const context = await getHeaders()

    expect((context.headers as Record<string, string>)['User-Agent']).toBe(
      'test-user-agent/1.0'
    )
  })
})

describe('validateRedditUrl', () => {
  it('accepts oauth.reddit.com URLs', () => {
    expect(() =>
      validateRedditUrl('https://oauth.reddit.com/r/popular/hot.json')
    ).not.toThrow()
  })

  it('accepts www.reddit.com URLs', () => {
    expect(() =>
      validateRedditUrl('https://www.reddit.com/r/popular/hot.json')
    ).not.toThrow()
  })

  it('accepts reddit.com URLs', () => {
    expect(() =>
      validateRedditUrl('https://reddit.com/r/popular/hot.json')
    ).not.toThrow()
  })

  it('rejects non-Reddit domains', () => {
    expect(() => validateRedditUrl('https://evil.com/steal-data')).toThrow(
      'Invalid request destination'
    )
  })

  it('rejects HTTP (non-HTTPS) URLs', () => {
    expect(() =>
      validateRedditUrl('http://oauth.reddit.com/r/popular/hot.json')
    ).toThrow('Invalid protocol - HTTPS required')
  })

  it('rejects malformed URLs', () => {
    expect(() => validateRedditUrl('not-a-url')).toThrow('Invalid URL format')
  })
})
