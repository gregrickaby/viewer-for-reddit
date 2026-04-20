import {NextRequest} from 'next/server'
import {beforeEach, describe, expect, it, vi} from 'vitest'

// Mock dependencies before imports
vi.mock('@/lib/utils/env', () => ({
  getEnvVar: vi.fn((key: string) => {
    if (key === 'REDDIT_REDIRECT_URI')
      return 'https://example.com/api/auth/callback/reddit'
    if (key === 'USER_AGENT') return 'test-user-agent'
    if (key === 'SESSION_SECRET') return 'test-secret-key'
    return ''
  }),
  isProduction: vi.fn(() => false)
}))

vi.mock('@/lib/axiom/server', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }
}))

vi.mock('@/lib/auth/session', () => ({
  persistSession: vi.fn(async () => {})
}))

vi.mock('@/lib/auth/processOAuthCallback', () => ({
  processOAuthCallback: vi.fn()
}))

// Import after mocks
import {processOAuthCallback} from '@/lib/auth/processOAuthCallback'
import {persistSession} from '@/lib/auth/session'
import {logger} from '@/lib/axiom/server'
import {getEnvVar} from '@/lib/utils/env'
import {GET} from './route'

const mockGetEnvVar = vi.mocked(getEnvVar)
const mockLogger = vi.mocked(logger)
const mockProcessOAuthCallback = vi.mocked(processOAuthCallback)
const mockPersistSession = vi.mocked(persistSession)

describe('GET /api/auth/callback/reddit', () => {
  const validState = 'test-state-123'
  const validCode = 'test-code-456'

  beforeEach(() => {
    vi.clearAllMocks()

    mockGetEnvVar.mockImplementation((key: string) => {
      if (key === 'REDDIT_REDIRECT_URI')
        return 'https://example.com/api/auth/callback/reddit'
      if (key === 'USER_AGENT') return 'test-user-agent'
      if (key === 'SESSION_SECRET') return 'test-secret-key'
      return ''
    })

    // Default: successful OAuth callback
    mockProcessOAuthCallback.mockResolvedValue({
      ok: true,
      sessionData: {
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
        expiresAt: Date.now() + 3600000,
        username: 'testuser',
        userId: 't2_user123'
      }
    })
  })

  it('successfully completes OAuth flow', async () => {
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
    expect(mockPersistSession).toHaveBeenCalledTimes(1)
  })

  it('saves session data correctly', async () => {
    const sessionData = {
      accessToken: 'test-access-token',
      refreshToken: 'test-refresh-token',
      expiresAt: Date.now() + 3600000,
      username: 'testuser',
      userId: 't2_user123'
    }

    mockProcessOAuthCallback.mockResolvedValue({
      ok: true,
      sessionData
    })

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

    expect(mockPersistSession).toHaveBeenCalledWith(sessionData)
  })

  it('deletes state cookie after successful auth', async () => {
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

    // Cookie is deleted (value is empty)
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
      expect.any(Object)
    )
  })

  it('logs warning for mismatched redirect URI but continues', async () => {
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
      expect.any(Object)
    )
  })

  it('handles user data fetch failure (401)', async () => {
    mockProcessOAuthCallback.mockResolvedValue({
      ok: false,
      reason: 'identity_failed',
      message: 'Reddit API responded with 401'
    })

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
    mockProcessOAuthCallback.mockResolvedValue({
      ok: false,
      reason: 'identity_failed',
      message: 'Reddit API responded with 429'
    })

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
    mockProcessOAuthCallback.mockResolvedValue({
      ok: false,
      reason: 'identity_failed',
      message: 'Reddit API responded with 503'
    })

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
    mockProcessOAuthCallback.mockRejectedValue(new Error('Unexpected failure'))

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
    mockProcessOAuthCallback.mockResolvedValue({
      ok: true,
      sessionData: {
        accessToken: 'test-access-token',
        refreshToken: '',
        expiresAt: Date.now() + 3600000,
        username: 'testuser',
        userId: 't2_user123'
      }
    })

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
    expect(mockPersistSession).toHaveBeenCalledWith(
      expect.objectContaining({refreshToken: ''})
    )
  })

  it('logs authentication flow', async () => {
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
      expect.any(Object)
    )

    expect(mockLogger.info).toHaveBeenCalledWith(
      'OAuth authentication successful',
      expect.objectContaining({username: 'testuser', context: 'OAuthCallback'})
    )
  })

  it('handles missing host headers gracefully', async () => {
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
      expect.any(Object)
    )
  })
})
