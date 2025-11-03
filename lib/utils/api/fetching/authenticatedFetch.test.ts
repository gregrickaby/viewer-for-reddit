import {server} from '@/test-utils/msw/server'
import {http, HttpResponse} from 'msw'
import {beforeEach, describe, expect, it, vi} from 'vitest'

// Mock session module
const mockSession = {
  username: 'testuser',
  accessToken: 'mock_access_token',
  refreshToken: 'mock_refresh_token',
  expiresAt: Date.now() + 3600000,
  sessionVersion: 1
}

vi.mock('@/lib/auth/session', () => ({
  getSession: vi.fn()
}))

vi.mock('@/lib/utils/logging/logError', () => ({
  logError: vi.fn()
}))

describe('authenticatedFetch', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    vi.resetModules()

    // Default: user is authenticated
    const {getSession} = await import('@/lib/auth/session')
    vi.mocked(getSession).mockResolvedValue(mockSession)
  })

  it('should make authenticated request with user session token', async () => {
    server.use(
      http.get('https://oauth.reddit.com/api/v1/me', ({request}) => {
        const authHeader = request.headers.get('Authorization')
        expect(authHeader).toBe('Bearer mock_access_token')

        return HttpResponse.json({
          name: 'testuser',
          id: 'abc123'
        })
      })
    )

    const {authenticatedFetch} = await import('./authenticatedFetch')
    const data = await authenticatedFetch('/api/v1/me')

    expect(data).toEqual({
      name: 'testuser',
      id: 'abc123'
    })
  })

  it('should return null when user is not authenticated', async () => {
    const {getSession} = await import('@/lib/auth/session')
    vi.mocked(getSession).mockResolvedValue(null)

    const {authenticatedFetch} = await import('./authenticatedFetch')
    const data = await authenticatedFetch('/api/v1/me')

    expect(data).toBeNull()
  })

  it('should handle full URLs', async () => {
    server.use(
      http.get('https://oauth.reddit.com/r/test/hot', () => {
        return HttpResponse.json({data: {children: []}})
      })
    )

    const {authenticatedFetch} = await import('./authenticatedFetch')
    const data = await authenticatedFetch('https://oauth.reddit.com/r/test/hot')

    expect(data).toEqual({data: {children: []}})
  })

  it('should return null on HTTP error', async () => {
    server.use(
      http.get('https://oauth.reddit.com/api/v1/me', () => {
        return new HttpResponse(null, {status: 401})
      })
    )

    const {authenticatedFetch} = await import('./authenticatedFetch')
    const data = await authenticatedFetch('/api/v1/me')

    expect(data).toBeNull()
  })

  it('should log errors on failure', async () => {
    server.use(
      http.get('https://oauth.reddit.com/api/v1/me', () => {
        return new HttpResponse(null, {status: 500})
      })
    )

    const {logError} = await import('@/lib/utils/logging/logError')
    const {authenticatedFetch} = await import('./authenticatedFetch')

    await authenticatedFetch('/api/v1/me')

    expect(logError).toHaveBeenCalledWith(
      expect.stringContaining('Reddit API error: 500'),
      expect.objectContaining({
        component: 'authenticatedFetch',
        endpoint: '/api/v1/me',
        status: 500
      })
    )
  })

  it('should pass through custom headers', async () => {
    server.use(
      http.get('https://oauth.reddit.com/api/v1/me', ({request}) => {
        expect(request.headers.get('X-Custom-Header')).toBe('test')
        return HttpResponse.json({success: true})
      })
    )

    const {authenticatedFetch} = await import('./authenticatedFetch')
    await authenticatedFetch('/api/v1/me', {
      headers: {
        'X-Custom-Header': 'test'
      }
    })
  })

  it('should handle network errors', async () => {
    server.use(
      http.get('https://oauth.reddit.com/api/v1/me', () => {
        return HttpResponse.error()
      })
    )

    const {logError} = await import('@/lib/utils/logging/logError')
    const {authenticatedFetch} = await import('./authenticatedFetch')

    const data = await authenticatedFetch('/api/v1/me')

    expect(data).toBeNull()
    expect(logError).toHaveBeenCalled()
  })

  it('should include User-Agent header', async () => {
    server.use(
      http.get('https://oauth.reddit.com/api/v1/me', ({request}) => {
        expect(request.headers.get('User-Agent')).toBe('test-user-agent')
        return HttpResponse.json({success: true})
      })
    )

    const {authenticatedFetch} = await import('./authenticatedFetch')
    await authenticatedFetch('/api/v1/me')
  })
})
