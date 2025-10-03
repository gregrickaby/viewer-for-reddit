import {NextRequest, NextResponse} from 'next/server'
import {beforeEach, describe, expect, it, vi} from 'vitest'
import {GET} from './route'

// Mock Reddit client
const mockReddit = {
  createAuthorizationURL: vi.fn((state: string, scopes: string[]) => {
    return new URL(
      `https://www.reddit.com/api/v1/authorize?state=${state}&scope=${scopes.join(' ')}`
    )
  })
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

vi.mock('@/lib/auth/auditLog', () => ({
  logAuditEvent: vi.fn(),
  getClientInfo: vi.fn(() => ({
    ip: '127.0.0.1',
    userAgent: 'test-agent'
  }))
}))

describe('POST /api/auth/login', () => {
  let mockCookieStore: {
    set: ReturnType<typeof vi.fn>
  }

  beforeEach(async () => {
    vi.clearAllMocks()

    mockCookieStore = {
      set: vi.fn()
    }

    const {cookies} = await import('next/headers')
    vi.mocked(cookies).mockResolvedValue(mockCookieStore as any)

    const {checkRateLimit} = await import('@/lib/auth/rateLimit')
    vi.mocked(checkRateLimit).mockResolvedValue(null)
  })

  it('should initiate OAuth flow and redirect to Reddit', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/login')

    const response = await GET(request)

    expect(response.status).toBe(307) // Redirect status
    expect(response.headers.get('location')).toContain(
      'https://www.reddit.com/api/v1/authorize'
    )
    expect(response.headers.get('location')).toContain('state=')
    expect(response.headers.get('location')).toContain('scope=')
  })

  it('should request correct OAuth scopes', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/login')

    await GET(request)

    expect(mockReddit.createAuthorizationURL).toHaveBeenCalledWith(
      expect.any(String),
      ['identity', 'read', 'mysubreddits', 'vote', 'subscribe']
    )
  })

  it('should set state cookie for CSRF protection', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/login')

    await GET(request)

    expect(mockCookieStore.set).toHaveBeenCalledWith(
      'reddit_oauth_state',
      expect.any(String),
      {
        httpOnly: true,
        sameSite: 'lax',
        secure: false, // Development mode
        maxAge: 600, // 10 minutes
        path: '/'
      }
    )
  })

  it('should set secure cookie in production', async () => {
    vi.stubEnv('NODE_ENV', 'production')

    const request = new NextRequest('http://localhost:3000/api/auth/login')

    await GET(request)

    expect(mockCookieStore.set).toHaveBeenCalledWith(
      'reddit_oauth_state',
      expect.any(String),
      expect.objectContaining({
        secure: true
      })
    )
  })

  it('should log audit event for login initiation', async () => {
    const {logAuditEvent} = await import('@/lib/auth/auditLog')
    const request = new NextRequest('http://localhost:3000/api/auth/login')

    await GET(request)

    expect(logAuditEvent).toHaveBeenCalledWith({
      type: 'login_initiated',
      ip: '127.0.0.1',
      userAgent: 'test-agent'
    })
  })

  it('should return rate limit response when rate limited', async () => {
    const {checkRateLimit} = await import('@/lib/auth/rateLimit')
    const rateLimitResponse = NextResponse.json(
      {error: 'rate_limited'},
      {status: 429}
    )
    vi.mocked(checkRateLimit).mockResolvedValue(rateLimitResponse)

    const request = new NextRequest('http://localhost:3000/api/auth/login')

    const response = await GET(request)

    expect(response.status).toBe(429)
  })

  it('should generate unique state for each request', async () => {
    const request1 = new NextRequest('http://localhost:3000/api/auth/login')
    const request2 = new NextRequest('http://localhost:3000/api/auth/login')

    await GET(request1)
    await GET(request2)

    // Each request sets one cookie: reddit_oauth_state
    const [call1Name] = mockCookieStore.set.mock.calls[0]
    const [call2Name] = mockCookieStore.set.mock.calls[1]

    expect(call1Name).toBe('reddit_oauth_state')
    expect(call2Name).toBe('reddit_oauth_state')

    // State values should be different
    const state1 = mockCookieStore.set.mock.calls[0][1]
    const state2 = mockCookieStore.set.mock.calls[1][1]
    expect(state1).not.toBe(state2)
  })

  it('should set cache control headers to prevent caching', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/login')

    const response = await GET(request)

    expect(response.headers.get('Cache-Control')).toBe(
      'private, no-cache, no-store, must-revalidate'
    )
    expect(response.headers.get('Pragma')).toBe('no-cache')
    expect(response.headers.get('Expires')).toBe('0')
  })
})
