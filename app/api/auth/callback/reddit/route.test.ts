import {server} from '@/test-utils/msw/server'
import {http, HttpResponse} from 'msw'
import {NextRequest, NextResponse} from 'next/server'
import {beforeEach, describe, expect, it, vi} from 'vitest'
import {GET} from './route'

// Mock Reddit client
const mockReddit = {
  validateAuthorizationCode: vi.fn()
}

// Mock dependencies
vi.mock('@/lib/auth/arctic', () => ({
  getRedditClient: vi.fn(() => mockReddit)
}))

vi.mock('next/headers', () => ({
  cookies: vi.fn()
}))

vi.mock('@/lib/auth/rateLimit', () => ({
  checkRateLimit: vi.fn()
}))

vi.mock('@/lib/auth/session', () => ({
  setSession: vi.fn()
}))

describe('GET /api/auth/callback/reddit', () => {
  let mockCookieStore: {
    get: ReturnType<typeof vi.fn>
    delete: ReturnType<typeof vi.fn>
  }

  const mockTokens = {
    accessToken: () => 'access_token_123',
    refreshToken: () => 'refresh_token_123',
    accessTokenExpiresAt: () => new Date(Date.now() + 3600000)
  }

  beforeEach(async () => {
    vi.clearAllMocks()

    mockCookieStore = {
      get: vi.fn(),
      delete: vi.fn()
    }

    const {cookies} = await import('next/headers')
    vi.mocked(cookies).mockResolvedValue(mockCookieStore as any)

    const {checkRateLimit} = await import('@/lib/auth/rateLimit')
    vi.mocked(checkRateLimit).mockResolvedValue(null)

    vi.mocked(mockReddit.validateAuthorizationCode).mockResolvedValue(
      mockTokens as any
    )

    // Default mock for cookies: state and origin
    mockCookieStore.get.mockImplementation((name: string) => {
      if (name === 'reddit_oauth_state') {
        return {value: 'test_state'}
      }
      if (name === 'reddit_oauth_origin') {
        return {value: 'http://localhost:3000'}
      }
      return undefined
    })

    // Setup MSW handler for Reddit user info
    server.use(
      http.get('https://oauth.reddit.com/api/v1/me', () => {
        return HttpResponse.json({
          name: 'testuser',
          id: 'test123',
          icon_img: 'https://example.com/avatar.png',
          created_utc: 1234567890
        })
      })
    )
  })

  it('should complete OAuth flow and create session', async () => {
    const {setSession} = await import('@/lib/auth/session')

    const url =
      'http://localhost:3000/api/auth/callback/reddit?code=auth_code&state=test_state'
    const request = new NextRequest(url)

    const response = await GET(request)

    expect(response.status).toBe(307) // Redirect
    expect(response.headers.get('location')).toBe('http://localhost:3000/')

    expect(setSession).toHaveBeenCalledWith({
      username: 'testuser',
      accessToken: 'access_token_123',
      refreshToken: 'refresh_token_123',
      expiresAt: expect.any(Number),
      avatarUrl: 'https://example.com/avatar.png'
    })

    expect(mockCookieStore.delete).toHaveBeenCalledWith('reddit_oauth_state')
  })

  it('should handle user with snoovatar', async () => {
    const {setSession} = await import('@/lib/auth/session')

    server.use(
      http.get('https://oauth.reddit.com/api/v1/me', () => {
        return HttpResponse.json({
          name: 'testuser',
          snoovatar_img: 'https://example.com/snoovatar.png',
          icon_img: 'https://example.com/icon.png'
        })
      })
    )

    const url =
      'http://localhost:3000/api/auth/callback/reddit?code=auth_code&state=test_state'
    const request = new NextRequest(url)

    await GET(request)

    expect(setSession).toHaveBeenCalledWith(
      expect.objectContaining({
        avatarUrl: 'https://example.com/snoovatar.png'
      })
    )
  })

  it('should handle HTML entity in avatar URLs', async () => {
    const {setSession} = await import('@/lib/auth/session')

    server.use(
      http.get('https://oauth.reddit.com/api/v1/me', () => {
        return HttpResponse.json({
          name: 'testuser',
          icon_img: 'https://example.com/avatar.png?v=1&amp;s=2'
        })
      })
    )

    const url =
      'http://localhost:3000/api/auth/callback/reddit?code=auth_code&state=test_state'
    const request = new NextRequest(url)

    await GET(request)

    expect(setSession).toHaveBeenCalledWith(
      expect.objectContaining({
        avatarUrl: 'https://example.com/avatar.png?v=1&s=2'
      })
    )
  })

  it('should handle missing refresh token', async () => {
    const {setSession} = await import('@/lib/auth/session')

    const tokensWithoutRefresh = {
      accessToken: () => 'access_token_123',
      refreshToken: () => {
        throw new Error('No refresh token')
      },
      accessTokenExpiresAt: () => new Date(Date.now() + 3600000)
    }

    vi.mocked(mockReddit.validateAuthorizationCode).mockResolvedValue(
      tokensWithoutRefresh as any
    )

    const url =
      'http://localhost:3000/api/auth/callback/reddit?code=auth_code&state=test_state'
    const request = new NextRequest(url)

    await GET(request)

    expect(setSession).toHaveBeenCalledWith(
      expect.objectContaining({
        refreshToken: ''
      })
    )
  })

  it('should redirect with error when code is missing', async () => {
    const url =
      'http://localhost:3000/api/auth/callback/reddit?state=test_state'
    const request = new NextRequest(url)

    const response = await GET(request)

    expect(response.status).toBe(307)
    const location = response.headers.get('location')
    expect(location).toContain('error=invalid_state')
  })

  it('should redirect with error when state is missing', async () => {
    const url = 'http://localhost:3000/api/auth/callback/reddit?code=auth_code'
    const request = new NextRequest(url)

    const response = await GET(request)

    expect(response.status).toBe(307)
    const location = response.headers.get('location')
    expect(location).toContain('error=invalid_state')
  })

  it('should redirect with error when stored state is missing', async () => {
    mockCookieStore.get.mockReturnValue(undefined)

    const url =
      'http://localhost:3000/api/auth/callback/reddit?code=auth_code&state=test_state'
    const request = new NextRequest(url)

    const response = await GET(request)

    expect(response.status).toBe(307)
    const location = response.headers.get('location')
    expect(location).toContain('error=invalid_state')
  })

  it('should redirect with error when state does not match', async () => {
    mockCookieStore.get.mockImplementation((name: string) => {
      if (name === 'reddit_oauth_state') {
        return {value: 'different_state'}
      }
      if (name === 'reddit_oauth_origin') {
        return {value: 'http://localhost:3000'}
      }
      return undefined
    })

    const url =
      'http://localhost:3000/api/auth/callback/reddit?code=auth_code&state=test_state'
    const request = new NextRequest(url)

    const response = await GET(request)

    expect(response.status).toBe(307)
    const location = response.headers.get('location')
    expect(location).toContain('error=invalid_state')
  })

  it('should redirect with error when user info fetch fails', async () => {
    server.use(
      http.get('https://oauth.reddit.com/api/v1/me', () => {
        return HttpResponse.json({error: 'failed'}, {status: 500})
      })
    )

    const url =
      'http://localhost:3000/api/auth/callback/reddit?code=auth_code&state=test_state'
    const request = new NextRequest(url)

    const response = await GET(request)

    expect(response.status).toBe(307)
    const location = response.headers.get('location')
    expect(location).toContain('error=authentication_failed')
    expect(location).toContain('Unable%20to%20complete%20sign%20in')
  })

  it('should redirect with OAuth error for OAuth2RequestError', async () => {
    const {OAuth2RequestError} = await import('arctic')

    const oauthError = new OAuth2RequestError(
      'https://test.com',
      'invalid_grant',
      'Invalid authorization code',
      null
    )

    vi.mocked(mockReddit.validateAuthorizationCode).mockRejectedValue(
      oauthError
    )

    const url =
      'http://localhost:3000/api/auth/callback/reddit?code=auth_code&state=test_state'
    const request = new NextRequest(url)

    const response = await GET(request)

    expect(response.status).toBe(307)
    const location = response.headers.get('location')
    expect(location).toContain('error=oauth_error')
    expect(location).toContain('Authentication%20failed')
  })

  it('should handle HTML entity in avatar URLs', async () => {
    const {setSession} = await import('@/lib/auth/session')

    server.use(
      http.get('https://oauth.reddit.com/api/v1/me', () => {
        return HttpResponse.json({
          name: 'testuser',
          icon_img: 'https://example.com/avatar.png?v=1&amp;s=2'
        })
      })
    )

    mockCookieStore.get.mockReturnValue({value: 'test_state'})

    const url =
      'http://localhost:3000/api/auth/callback/reddit?code=auth_code&state=test_state'
    const request = new NextRequest(url)

    await GET(request)

    expect(setSession).toHaveBeenCalledWith(
      expect.objectContaining({
        avatarUrl: 'https://example.com/avatar.png?v=1&s=2'
      })
    )
  })

  it('should handle missing refresh token', async () => {
    const {setSession} = await import('@/lib/auth/session')

    const tokensWithoutRefresh = {
      accessToken: () => 'access_token_123',
      refreshToken: () => {
        throw new Error('No refresh token')
      },
      accessTokenExpiresAt: () => new Date(Date.now() + 3600000)
    }

    vi.mocked(mockReddit.validateAuthorizationCode).mockResolvedValue(
      tokensWithoutRefresh as any
    )

    mockCookieStore.get.mockReturnValue({value: 'test_state'})

    const url =
      'http://localhost:3000/api/auth/callback/reddit?code=auth_code&state=test_state'
    const request = new NextRequest(url)

    await GET(request)

    expect(setSession).toHaveBeenCalledWith(
      expect.objectContaining({
        refreshToken: ''
      })
    )
  })

  it('should redirect with error when code is missing', async () => {
    mockCookieStore.get.mockReturnValue({value: 'test_state'})

    const url =
      'http://localhost:3000/api/auth/callback/reddit?state=test_state'
    const request = new NextRequest(url)

    const response = await GET(request)

    expect(response.status).toBe(307)
    const location = response.headers.get('location')
    expect(location).toContain('error=invalid_state')
    expect(location).toContain('Security%20validation%20failed')
  })

  it('should redirect with error when state is missing', async () => {
    mockCookieStore.get.mockReturnValue({value: 'test_state'})

    const url = 'http://localhost:3000/api/auth/callback/reddit?code=auth_code'
    const request = new NextRequest(url)

    const response = await GET(request)

    expect(response.status).toBe(307)
    const location = response.headers.get('location')
    expect(location).toContain('error=invalid_state')
  })

  it('should redirect with error when stored state is missing', async () => {
    mockCookieStore.get.mockReturnValue(undefined)

    const url =
      'http://localhost:3000/api/auth/callback/reddit?code=auth_code&state=test_state'
    const request = new NextRequest(url)

    const response = await GET(request)

    expect(response.status).toBe(307)
    const location = response.headers.get('location')
    expect(location).toContain('error=invalid_state')
  })

  it('should redirect with error when state does not match', async () => {
    mockCookieStore.get.mockReturnValue({value: 'different_state'})

    const url =
      'http://localhost:3000/api/auth/callback/reddit?code=auth_code&state=test_state'
    const request = new NextRequest(url)

    const response = await GET(request)

    expect(response.status).toBe(307)
    const location = response.headers.get('location')
    expect(location).toContain('error=invalid_state')
  })

  it('should redirect with error when user info fetch fails', async () => {
    server.use(
      http.get('https://oauth.reddit.com/api/v1/me', () => {
        return HttpResponse.json({error: 'Unauthorized'}, {status: 401})
      })
    )

    mockCookieStore.get.mockReturnValue({value: 'test_state'})

    const url =
      'http://localhost:3000/api/auth/callback/reddit?code=auth_code&state=test_state'
    const request = new NextRequest(url)

    const response = await GET(request)

    expect(response.status).toBe(307)
    const location = response.headers.get('location')
    expect(location).toContain('error=authentication_failed')
    expect(location).toContain('Unable%20to%20complete%20sign%20in')
  })

  it('should redirect with OAuth error for OAuth2RequestError', async () => {
    const {OAuth2RequestError} = await import('arctic')

    const oauthError = new OAuth2RequestError(
      'https://test.com',
      'invalid_grant',
      'Invalid authorization code',
      null
    )

    vi.mocked(mockReddit.validateAuthorizationCode).mockRejectedValue(
      oauthError
    )

    mockCookieStore.get.mockReturnValue({value: 'test_state'})

    const url =
      'http://localhost:3000/api/auth/callback/reddit?code=auth_code&state=test_state'
    const request = new NextRequest(url)

    const response = await GET(request)

    expect(response.status).toBe(307)
    const location = response.headers.get('location')
    expect(location).toContain('error=oauth_error')
    expect(location).toContain('Authentication%20failed')
  })

  it('should return rate limit response when rate limited', async () => {
    const {checkRateLimit} = await import('@/lib/auth/rateLimit')
    const rateLimitResponse = NextResponse.json(
      {error: 'rate_limited'},
      {status: 429}
    )
    vi.mocked(checkRateLimit).mockResolvedValue(rateLimitResponse)

    const url =
      'http://localhost:3000/api/auth/callback/reddit?code=auth_code&state=test_state'
    const request = new NextRequest(url)

    const response = await GET(request)

    expect(response.status).toBe(429)
  })

  it('should handle user without avatar', async () => {
    const {setSession} = await import('@/lib/auth/session')

    server.use(
      http.get('https://oauth.reddit.com/api/v1/me', () => {
        return HttpResponse.json({
          name: 'testuser',
          id: 'test123'
        })
      })
    )

    mockCookieStore.get.mockReturnValue({value: 'test_state'})

    const url =
      'http://localhost:3000/api/auth/callback/reddit?code=auth_code&state=test_state'
    const request = new NextRequest(url)

    await GET(request)

    expect(setSession).toHaveBeenCalledWith(
      expect.objectContaining({
        username: 'testuser',
        avatarUrl: undefined
      })
    )
  })

  it('should reject non-HTTPS avatar URLs', async () => {
    const {setSession} = await import('@/lib/auth/session')

    server.use(
      http.get('https://oauth.reddit.com/api/v1/me', () => {
        return HttpResponse.json({
          name: 'testuser',
          id: 'test123',
          icon_img: 'http://example.com/avatar.png' // HTTP, not HTTPS
        })
      })
    )

    mockCookieStore.get.mockReturnValue({value: 'test_state'})

    const url =
      'http://localhost:3000/api/auth/callback/reddit?code=auth_code&state=test_state'
    const request = new NextRequest(url)

    await GET(request)

    // Should not include the HTTP avatar URL
    expect(setSession).toHaveBeenCalledWith(
      expect.objectContaining({
        username: 'testuser',
        avatarUrl: undefined
      })
    )
  })

  it('should handle Reddit API timeout', async () => {
    // Mock AbortController to simulate timeout
    const originalAbortController = globalThis.AbortController
    const mockAbortController = vi.fn(() => ({
      signal: {aborted: false, addEventListener: vi.fn()},
      abort: vi.fn()
    }))
    globalThis.AbortController = mockAbortController as any

    // Mock fetch to throw AbortError
    const originalFetch = globalThis.fetch
    globalThis.fetch = vi.fn(() => {
      const error = new Error('The operation was aborted')
      error.name = 'AbortError'
      return Promise.reject(error)
    }) as any

    mockCookieStore.get.mockReturnValue({value: 'test_state'})

    const url =
      'http://localhost:3000/api/auth/callback/reddit?code=auth_code&state=test_state'
    const request = new NextRequest(url)

    const response = await GET(request)

    expect(response.status).toBe(307)
    const location = response.headers.get('location')
    expect(location).toContain('error=authentication_failed')
    expect(location).toContain('error_id=') // Should include error ID

    // Restore original
    globalThis.AbortController = originalAbortController
    globalThis.fetch = originalFetch
  })

  it('should include error_id in failed login redirects', async () => {
    server.use(
      http.get('https://oauth.reddit.com/api/v1/me', () => {
        return new HttpResponse(null, {status: 500})
      })
    )

    mockCookieStore.get.mockReturnValue({value: 'test_state'})

    const url =
      'http://localhost:3000/api/auth/callback/reddit?code=auth_code&state=test_state'
    const request = new NextRequest(url)

    const response = await GET(request)

    const location = response.headers.get('location')
    expect(location).toMatch(/error_id=[a-f0-9-]{36}/) // UUID format
  })

  it('should validate Reddit user data structure', async () => {
    server.use(
      http.get('https://oauth.reddit.com/api/v1/me', () => {
        // Invalid response - missing name
        return HttpResponse.json({
          id: 'test123'
          // name is missing
        })
      })
    )

    mockCookieStore.get.mockReturnValue({value: 'test_state'})

    const url =
      'http://localhost:3000/api/auth/callback/reddit?code=auth_code&state=test_state'
    const request = new NextRequest(url)

    const response = await GET(request)

    expect(response.status).toBe(307)
    const location = response.headers.get('location')
    expect(location).toContain('error=authentication_failed')
  })

  it('should sanitize invalid icon_img types', async () => {
    const {setSession} = await import('@/lib/auth/session')

    server.use(
      http.get('https://oauth.reddit.com/api/v1/me', () => {
        return HttpResponse.json({
          name: 'testuser',
          id: 'test123',
          icon_img: 12345 // Invalid type - should be string
        })
      })
    )

    mockCookieStore.get.mockReturnValue({value: 'test_state'})

    const url =
      'http://localhost:3000/api/auth/callback/reddit?code=auth_code&state=test_state'
    const request = new NextRequest(url)

    await GET(request)

    // Should handle gracefully and not include invalid avatar
    expect(setSession).toHaveBeenCalledWith(
      expect.objectContaining({
        username: 'testuser',
        avatarUrl: undefined
      })
    )
  })

  it('should decode all common HTML entities in avatar URLs', async () => {
    const {setSession} = await import('@/lib/auth/session')

    server.use(
      http.get('https://oauth.reddit.com/api/v1/me', () => {
        return HttpResponse.json({
          name: 'testuser',
          id: 'test123',
          icon_img:
            'https://example.com/avatar.png?param=value&amp;other=test&lt;tag&gt;'
        })
      })
    )

    mockCookieStore.get.mockReturnValue({value: 'test_state'})

    const url =
      'http://localhost:3000/api/auth/callback/reddit?code=auth_code&state=test_state'
    const request = new NextRequest(url)

    await GET(request)

    expect(setSession).toHaveBeenCalledWith(
      expect.objectContaining({
        avatarUrl: 'https://example.com/avatar.png?param=value&other=test<tag>'
      })
    )
  })

  it('should set cache control headers on redirect responses', async () => {
    mockCookieStore.get.mockReturnValue({value: 'test_state'})

    const url =
      'http://localhost:3000/api/auth/callback/reddit?code=auth_code&state=test_state'
    const request = new NextRequest(url)

    const response = await GET(request)

    expect(response.headers.get('Cache-Control')).toBe(
      'private, no-cache, no-store, must-revalidate'
    )
    expect(response.headers.get('Pragma')).toBe('no-cache')
    expect(response.headers.get('Expires')).toBe('0')
  })
})
