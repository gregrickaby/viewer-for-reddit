import {http, HttpResponse, server} from '@/test-utils'
import {NextRequest} from 'next/server'
import {beforeEach, describe, expect, it, vi} from 'vitest'

// Mock dependencies before imports
vi.mock('@/lib/utils/env', () => ({
  getEnvVar: vi.fn((key: string) => {
    if (key === 'REDDIT_CLIENT_ID') return 'test-client-id'
    if (key === 'REDDIT_CLIENT_SECRET') return 'test-client-secret'
    if (key === 'REDDIT_REDIRECT_URI')
      return 'https://example.com/api/auth/callback/reddit'
    if (key === 'USER_AGENT') return 'test-user-agent'
    if (key === 'SESSION_SECRET') return 'test-secret-key'
    return ''
  }),
  isProduction: vi.fn(() => false)
}))

vi.mock('@/lib/utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }
}))

vi.mock('@/lib/auth/session', () => ({
  getSession: vi.fn(async () => ({
    accessToken: undefined,
    refreshToken: undefined,
    expiresAt: undefined,
    username: undefined,
    userId: undefined,
    save: vi.fn()
  }))
}))

let mockValidateAuthorizationCode: any

vi.mock('arctic', () => ({
  Reddit: class Reddit {
    validateAuthorizationCode = (...args: any[]) => {
      if (!mockValidateAuthorizationCode) {
        throw new Error('mockValidateAuthorizationCode not initialized')
      }
      return mockValidateAuthorizationCode(...args)
    }
  }
}))

// Import after mocks
import {getSession} from '@/lib/auth/session'
import {getEnvVar} from '@/lib/utils/env'
import {logger} from '@/lib/utils/logger'
import {GET} from './route'

const mockGetEnvVar = vi.mocked(getEnvVar)
const mockLogger = vi.mocked(logger)
const mockGetSession = vi.mocked(getSession)

describe('GET /api/auth/callback/reddit', () => {
  const validState = 'test-state-123'
  const validCode = 'test-code-456'

  beforeEach(() => {
    vi.clearAllMocks()

    // Initialize mockValidateAuthorizationCode
    const mockTokens = {
      accessToken: vi.fn(() => 'test-access-token'),
      refreshToken: vi.fn(() => 'test-refresh-token'),
      accessTokenExpiresAt: vi.fn(() => new Date(Date.now() + 3600000))
    }
    mockValidateAuthorizationCode = vi.fn().mockResolvedValue(mockTokens)

    mockGetEnvVar.mockImplementation((key: string) => {
      if (key === 'REDDIT_CLIENT_ID') return 'test-client-id'
      if (key === 'REDDIT_CLIENT_SECRET') return 'test-client-secret'
      if (key === 'REDDIT_REDIRECT_URI')
        return 'https://example.com/api/auth/callback/reddit'
      if (key === 'USER_AGENT') return 'test-user-agent'
      if (key === 'SESSION_SECRET') return 'test-secret-key'
      return ''
    })

    // Set up MSW handler for successful user data fetch
    server.use(
      http.get('https://oauth.reddit.com/api/v1/me', () => {
        return HttpResponse.json({
          name: 'testuser',
          id: 't2_user123'
        })
      })
    )
  })

  it('successfully completes OAuth flow', async () => {
    const mockSave = vi.fn()
    mockGetSession.mockResolvedValue({
      accessToken: undefined,
      save: mockSave
    } as any)

    const request = new NextRequest(
      `https://example.com/api/auth/callback/reddit?code=${validCode}&state=${validState}`,
      {
        method: 'GET',
        headers: {
          cookie: `reddit_oauth_state=${validState}`,
          host: 'example.com',
          'x-forwarded-proto': 'https'
        }
      }
    )

    const response = await GET(request)

    expect(response.status).toBe(307) // Redirect
    const location = response.headers.get('location')
    expect(location).toBe('https://example.com/')
    expect(mockSave).toHaveBeenCalledTimes(1)
  })

  it('saves session data correctly', async () => {
    const sessionData: any = {
      accessToken: undefined,
      refreshToken: undefined,
      expiresAt: undefined,
      username: undefined,
      userId: undefined,
      save: vi.fn()
    }

    mockGetSession.mockResolvedValue(sessionData)

    const request = new NextRequest(
      `https://example.com/api/auth/callback/reddit?code=${validCode}&state=${validState}`,
      {
        headers: {
          cookie: `reddit_oauth_state=${validState}`,
          host: 'example.com',
          'x-forwarded-proto': 'https'
        }
      }
    )

    await GET(request)

    expect(sessionData.accessToken).toBe('test-access-token')
    expect(sessionData.refreshToken).toBe('test-refresh-token')
    expect(sessionData.username).toBe('testuser')
    expect(sessionData.userId).toBe('t2_user123')
    expect(sessionData.save).toHaveBeenCalled()
  })

  it('deletes state cookie after successful auth', async () => {
    mockGetSession.mockResolvedValue({
      save: vi.fn()
    } as any)

    const request = new NextRequest(
      `https://example.com/api/auth/callback/reddit?code=${validCode}&state=${validState}`,
      {
        headers: {
          cookie: `reddit_oauth_state=${validState}`,
          host: 'example.com',
          'x-forwarded-proto': 'https'
        }
      }
    )

    const response = await GET(request)

    const cookies = response.cookies.getAll()
    const stateCookie = cookies.find((c) => c.name === 'reddit_oauth_state')

    // Check that the cookie is being deleted (value is empty)
    expect(stateCookie?.value).toBe('')
  })

  it('rejects request with OAuth error from Reddit', async () => {
    const request = new NextRequest(
      'https://example.com/api/auth/callback/reddit?error=access_denied&error_description=User+denied+access',
      {
        headers: {
          cookie: `reddit_oauth_state=${validState}`,
          host: 'example.com',
          'x-forwarded-proto': 'https'
        }
      }
    )

    const response = await GET(request)

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe(
      'https://example.com/?error=access_denied'
    )
    expect(mockLogger.error).toHaveBeenCalledWith(
      'OAuth error from Reddit',
      expect.any(Object),
      expect.any(Object)
    )

    // Verify state cookie is deleted
    const cookies = response.cookies.getAll()
    const stateCookie = cookies.find((c) => c.name === 'reddit_oauth_state')
    expect(stateCookie?.value).toBe('')
  })

  it('rejects request with missing code', async () => {
    const request = new NextRequest(
      `https://example.com/api/auth/callback/reddit?state=${validState}`,
      {
        headers: {
          cookie: `reddit_oauth_state=${validState}`
        }
      }
    )

    const response = await GET(request)

    expect(response.status).toBe(400)
    expect(await response.text()).toBe('Invalid state parameter')

    // Verify state cookie is deleted on error
    const cookies = response.cookies.getAll()
    const stateCookie = cookies.find((c) => c.name === 'reddit_oauth_state')
    expect(stateCookie?.value).toBe('')
  })

  it('rejects request with missing state', async () => {
    const request = new NextRequest(
      `https://example.com/api/auth/callback/reddit?code=${validCode}`,
      {
        headers: {
          cookie: `reddit_oauth_state=${validState}`
        }
      }
    )

    const response = await GET(request)

    expect(response.status).toBe(400)
    expect(await response.text()).toBe('Invalid state parameter')
  })

  it('rejects request with missing stored state', async () => {
    const request = new NextRequest(
      `https://example.com/api/auth/callback/reddit?code=${validCode}&state=${validState}`,
      {
        headers: {}
      }
    )

    const response = await GET(request)

    expect(response.status).toBe(400)
    expect(await response.text()).toBe('Invalid state parameter')
  })

  it('rejects request with mismatched state (CSRF protection)', async () => {
    const request = new NextRequest(
      `https://example.com/api/auth/callback/reddit?code=${validCode}&state=different-state`,
      {
        headers: {
          cookie: `reddit_oauth_state=${validState}`
        }
      }
    )

    const response = await GET(request)

    expect(response.status).toBe(400)
    expect(await response.text()).toBe('Invalid state parameter')
    expect(mockLogger.error).toHaveBeenCalledWith(
      'State validation failed - possible CSRF attack',
      expect.any(Object),
      expect.any(Object)
    )
  })

  it('logs warning for mismatched redirect URI but continues', async () => {
    mockGetSession.mockResolvedValue({
      save: vi.fn()
    } as any)

    const request = new NextRequest(
      `https://different.com/api/auth/callback/reddit?code=${validCode}&state=${validState}`,
      {
        headers: {
          cookie: `reddit_oauth_state=${validState}`,
          host: 'different.com',
          'x-forwarded-proto': 'https'
        }
      }
    )

    const response = await GET(request)

    // Should succeed despite mismatch (expected in proxied environments)
    expect(response.status).toBe(307)
    expect(mockLogger.warn).toHaveBeenCalledWith(
      'Redirect URI mismatch (expected in proxied environments)',
      expect.any(Object),
      expect.any(Object)
    )
  })

  it('handles user data fetch failure', async () => {
    server.use(
      http.get('https://oauth.reddit.com/api/v1/me', () => {
        return new HttpResponse('Unauthorized', {status: 401})
      })
    )

    const request = new NextRequest(
      `https://example.com/api/auth/callback/reddit?code=${validCode}&state=${validState}`,
      {
        headers: {
          cookie: `reddit_oauth_state=${validState}`,
          host: 'example.com',
          'x-forwarded-proto': 'https'
        }
      }
    )

    const response = await GET(request)

    expect(response.status).toBe(401)
    expect(await response.text()).toContain('Authentication expired')
  })

  it('handles rate limit error (429)', async () => {
    server.use(
      http.get('https://oauth.reddit.com/api/v1/me', () => {
        return new HttpResponse('Rate limit exceeded', {status: 429})
      })
    )

    const request = new NextRequest(
      `https://example.com/api/auth/callback/reddit?code=${validCode}&state=${validState}`,
      {
        headers: {
          cookie: `reddit_oauth_state=${validState}`,
          host: 'example.com',
          'x-forwarded-proto': 'https'
        }
      }
    )

    const response = await GET(request)

    expect(response.status).toBe(429)
    expect(await response.text()).toBe('Rate limit exceeded')
  })

  it('handles Reddit API unavailable (503)', async () => {
    server.use(
      http.get('https://oauth.reddit.com/api/v1/me', () => {
        return new HttpResponse('Service unavailable', {status: 503})
      })
    )

    const request = new NextRequest(
      `https://example.com/api/auth/callback/reddit?code=${validCode}&state=${validState}`,
      {
        headers: {
          cookie: `reddit_oauth_state=${validState}`,
          host: 'example.com',
          'x-forwarded-proto': 'https'
        }
      }
    )

    const response = await GET(request)

    expect(response.status).toBe(503)
    expect(await response.text()).toBe('Reddit API unavailable')
  })

  it('handles generic authentication error', async () => {
    server.use(
      http.get('https://oauth.reddit.com/api/v1/me', () => {
        return HttpResponse.error()
      })
    )

    const request = new NextRequest(
      `https://example.com/api/auth/callback/reddit?code=${validCode}&state=${validState}`,
      {
        headers: {
          cookie: `reddit_oauth_state=${validState}`,
          host: 'example.com',
          'x-forwarded-proto': 'https'
        }
      }
    )

    const response = await GET(request)

    expect(response.status).toBe(500)
    expect(await response.text()).toContain('Authentication failed')
  })

  it('handles missing refresh token gracefully', async () => {
    const mockTokens = {
      accessToken: vi.fn(() => 'test-access-token'),
      refreshToken: vi.fn(() => {
        throw new Error('No refresh token')
      }),
      accessTokenExpiresAt: vi.fn(() => new Date(Date.now() + 3600000))
    }

    mockValidateAuthorizationCode.mockResolvedValue(mockTokens)

    const sessionData: any = {
      save: vi.fn()
    }
    mockGetSession.mockResolvedValue(sessionData)

    const request = new NextRequest(
      `https://example.com/api/auth/callback/reddit?code=${validCode}&state=${validState}`,
      {
        headers: {
          cookie: `reddit_oauth_state=${validState}`,
          host: 'example.com',
          'x-forwarded-proto': 'https'
        }
      }
    )

    const response = await GET(request)

    expect(response.status).toBe(307)
    expect(sessionData.refreshToken).toBe('')
    expect(mockLogger.info).toHaveBeenCalledWith(
      'No refresh token provided by Reddit',
      undefined,
      expect.any(Object)
    )
  })

  it('logs authentication flow', async () => {
    mockGetSession.mockResolvedValue({
      save: vi.fn()
    } as any)

    const request = new NextRequest(
      `https://example.com/api/auth/callback/reddit?code=${validCode}&state=${validState}`,
      {
        headers: {
          cookie: `reddit_oauth_state=${validState}`,
          host: 'example.com',
          'x-forwarded-proto': 'https'
        }
      }
    )

    await GET(request)

    expect(mockLogger.debug).toHaveBeenCalledWith(
      'OAuth Callback',
      expect.any(Object),
      expect.any(Object)
    )

    expect(mockLogger.info).toHaveBeenCalledWith(
      'User authenticated',
      {username: 'testuser'},
      expect.any(Object)
    )
  })

  it('handles missing host headers gracefully', async () => {
    mockGetSession.mockResolvedValue({
      save: vi.fn()
    } as any)

    const request = new NextRequest(
      `https://example.com/api/auth/callback/reddit?code=${validCode}&state=${validState}`,
      {
        headers: {
          cookie: `reddit_oauth_state=${validState}`
          // No host or x-forwarded-host headers
        }
      }
    )

    const response = await GET(request)

    // Should not crash, should use fallback host from request URL
    expect(response.status).toBe(307)
    const location = response.headers.get('location')
    expect(location).toBe('https://example.com/')

    // Should log warning about missing headers
    expect(mockLogger.warn).toHaveBeenCalledWith(
      'No proxy headers found, using request URL host',
      expect.any(Object),
      expect.any(Object)
    )
  })
})
