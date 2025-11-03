import {checkRateLimit} from '@/lib/auth/rateLimit'
import {getSession} from '@/lib/auth/session'
import {logError} from '@/lib/utils/logging/logError'
import {validateOrigin} from '@/lib/utils/validation/errors/validateOrigin'
import {server} from '@/test-utils/msw/server'
import {http, HttpResponse} from 'msw'
import {NextRequest} from 'next/server'
import {beforeEach, describe, expect, it, vi} from 'vitest'
import {GET} from './route'

vi.mock('@/lib/auth/session')
vi.mock('@/lib/auth/rateLimit')
vi.mock('@/lib/utils/logging/logError')
vi.mock('@/lib/utils/validation/errors/validateOrigin')

const mockGetSession = vi.mocked(getSession)
const mockCheckRateLimit = vi.mocked(checkRateLimit)
const mockLogError = vi.mocked(logError)
const mockValidateOrigin = vi.mocked(validateOrigin)

describe('GET /api/reddit/subscriptions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockValidateOrigin.mockReturnValue(true)
    mockCheckRateLimit.mockResolvedValue(null)
  })

  describe('Origin validation', () => {
    it('should return 403 if origin validation fails', async () => {
      mockValidateOrigin.mockReturnValue(false)

      const request = new NextRequest(
        'http://localhost:3000/api/reddit/subscriptions'
      )
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data).toEqual({error: 'Forbidden'})
      expect(response.headers.get('Cache-Control')).toBe('no-store, max-age=0')
    })
  })

  describe('Rate limiting', () => {
    it('should return rate limit response if rate limited', async () => {
      const rateLimitResponse = new Response(
        JSON.stringify({error: 'Rate limit exceeded'}),
        {
          status: 429,
          headers: {'Retry-After': '60'}
        }
      )
      mockCheckRateLimit.mockResolvedValue(rateLimitResponse as any)

      const request = new NextRequest(
        'http://localhost:3000/api/reddit/subscriptions?path=/subreddits/mine/subscriber'
      )
      const response = await GET(request)

      expect(response.status).toBe(429)
      expect(mockCheckRateLimit).toHaveBeenCalledWith(request)
    })
  })

  describe('Path validation', () => {
    it('should return 400 if path parameter is missing', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/reddit/subscriptions'
      )
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toEqual({error: 'Path parameter is required'})
      expect(response.headers.get('Cache-Control')).toBe('no-store, max-age=0')
      expect(mockLogError).toHaveBeenCalledWith(
        'Missing required path parameter',
        expect.objectContaining({
          component: 'subscriptionsApiRoute',
          action: 'validatePath'
        })
      )
    })

    it('should return 400 if path is invalid', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/reddit/subscriptions?path=//evil.com/api'
      )
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toEqual({error: 'Invalid path parameter'})
      expect(response.headers.get('Cache-Control')).toBe('no-store, max-age=0')
      expect(mockLogError).toHaveBeenCalledWith(
        'Invalid or dangerous Reddit API path',
        expect.objectContaining({
          component: 'subscriptionsApiRoute',
          action: 'validatePath',
          path: '//evil.com/api'
        })
      )
    })
  })

  describe('Unauthenticated requests (graceful degradation)', () => {
    it('should return empty subscriptions array when not authenticated', async () => {
      mockGetSession.mockResolvedValue(null)

      const request = new NextRequest(
        'http://localhost:3000/api/reddit/subscriptions?path=/subreddits/mine/subscriber'
      )
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({data: {children: []}})
      expect(response.headers.get('Cache-Control')).toBe('no-store, max-age=0')
    })

    it('should return empty array when session has no access token', async () => {
      mockGetSession.mockResolvedValue({
        accessToken: '',
        refreshToken: 'refresh-token',
        expiresAt: Date.now() + 3600000,
        username: 'testuser',
        sessionVersion: 1
      })

      const request = new NextRequest(
        'http://localhost:3000/api/reddit/subscriptions?path=/subreddits/mine/subscriber'
      )
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({data: {children: []}})
    })
  })

  describe('Authenticated requests', () => {
    beforeEach(() => {
      mockGetSession.mockResolvedValue({
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
        expiresAt: Date.now() + 3600000,
        username: 'testuser',
        sessionVersion: 1
      })
    })

    it('should fetch subscriptions from Reddit API', async () => {
      const mockData = {
        data: {
          children: [
            {
              kind: 't5',
              data: {display_name: 'programming', subscribers: 1000}
            },
            {kind: 't5', data: {display_name: 'typescript', subscribers: 500}}
          ]
        }
      }

      server.use(
        http.get('https://oauth.reddit.com/subreddits/mine/subscriber', () => {
          return HttpResponse.json(mockData)
        })
      )

      const request = new NextRequest(
        'http://localhost:3000/api/reddit/subscriptions?path=/subreddits/mine/subscriber'
      )
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(mockData)
      expect(response.headers.get('Cache-Control')).toBe('no-store, max-age=0')
    })

    it('should use path from query parameter in API request', async () => {
      let capturedUrl = ''

      server.use(
        http.get(
          'https://oauth.reddit.com/subreddits/mine/subscriber',
          ({request}) => {
            capturedUrl = request.url
            return HttpResponse.json({data: {children: []}})
          }
        )
      )

      const request = new NextRequest(
        'http://localhost:3000/api/reddit/subscriptions?path=/subreddits/mine/subscriber'
      )
      await GET(request)

      expect(capturedUrl).toBe(
        'https://oauth.reddit.com/subreddits/mine/subscriber'
      )
    })
  })

  describe('Reddit API errors (graceful degradation)', () => {
    beforeEach(() => {
      mockGetSession.mockResolvedValue({
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
        expiresAt: Date.now() + 3600000,
        username: 'testuser',
        sessionVersion: 1
      })
    })

    it('should return empty array on 401 from Reddit API', async () => {
      server.use(
        http.get('https://oauth.reddit.com/subreddits/mine/subscriber', () => {
          return new HttpResponse(null, {status: 401})
        })
      )

      const request = new NextRequest(
        'http://localhost:3000/api/reddit/subscriptions?path=/subreddits/mine/subscriber'
      )
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({data: {children: []}})
      expect(response.headers.get('Cache-Control')).toBe('no-store, max-age=0')
      expect(mockLogError).toHaveBeenCalledWith(
        'Reddit subscriptions API request failed',
        expect.objectContaining({
          component: 'subscriptionsApiRoute',
          action: 'fetchRedditApi',
          status: 401
        })
      )
    })

    it('should return empty array on 403 from Reddit API', async () => {
      server.use(
        http.get('https://oauth.reddit.com/subreddits/mine/subscriber', () => {
          return new HttpResponse(null, {status: 403})
        })
      )

      const request = new NextRequest(
        'http://localhost:3000/api/reddit/subscriptions?path=/subreddits/mine/subscriber'
      )
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({data: {children: []}})
      expect(mockLogError).toHaveBeenCalled()
    })

    it('should return empty array on 404 from Reddit API', async () => {
      server.use(
        http.get('https://oauth.reddit.com/subreddits/mine/subscriber', () => {
          return new HttpResponse(null, {status: 404})
        })
      )

      const request = new NextRequest(
        'http://localhost:3000/api/reddit/subscriptions?path=/subreddits/mine/subscriber'
      )
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({data: {children: []}})
    })
  })

  describe('Error handling (graceful degradation)', () => {
    beforeEach(() => {
      mockGetSession.mockResolvedValue({
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
        expiresAt: Date.now() + 3600000,
        username: 'testuser',
        sessionVersion: 1
      })
    })

    it('should return empty array on network errors', async () => {
      server.use(
        http.get('https://oauth.reddit.com/subreddits/mine/subscriber', () => {
          return HttpResponse.error()
        })
      )

      const request = new NextRequest(
        'http://localhost:3000/api/reddit/subscriptions?path=/subreddits/mine/subscriber'
      )
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({data: {children: []}})
      expect(response.headers.get('Cache-Control')).toBe('no-store, max-age=0')
      expect(mockLogError).toHaveBeenCalledWith(
        'Unexpected error in subscriptions API proxy',
        expect.objectContaining({
          component: 'subscriptionsApiRoute',
          action: 'handleRequest'
        })
      )
    })

    it('should return empty array on JSON parse errors', async () => {
      server.use(
        http.get('https://oauth.reddit.com/subreddits/mine/subscriber', () => {
          return new HttpResponse('invalid json', {
            headers: {'Content-Type': 'application/json'}
          })
        })
      )

      const request = new NextRequest(
        'http://localhost:3000/api/reddit/subscriptions?path=/subreddits/mine/subscriber'
      )
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({data: {children: []}})
    })

    it('should return empty array on unexpected errors', async () => {
      mockGetSession.mockRejectedValue(new Error('Session error'))

      const request = new NextRequest(
        'http://localhost:3000/api/reddit/subscriptions?path=/subreddits/mine/subscriber'
      )
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({data: {children: []}})
    })
  })

  describe('Cache headers', () => {
    beforeEach(() => {
      mockGetSession.mockResolvedValue({
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
        expiresAt: Date.now() + 3600000,
        username: 'testuser',
        sessionVersion: 1
      })
    })

    it('should set no-store cache headers on success', async () => {
      server.use(
        http.get('https://oauth.reddit.com/subreddits/mine/subscriber', () => {
          return HttpResponse.json({data: {children: []}})
        })
      )

      const request = new NextRequest(
        'http://localhost:3000/api/reddit/subscriptions?path=/subreddits/mine/subscriber'
      )
      const response = await GET(request)

      expect(response.headers.get('Cache-Control')).toBe('no-store, max-age=0')
    })

    it('should set no-store cache headers on Reddit API errors', async () => {
      server.use(
        http.get('https://oauth.reddit.com/subreddits/mine/subscriber', () => {
          return new HttpResponse(null, {status: 500})
        })
      )

      const request = new NextRequest(
        'http://localhost:3000/api/reddit/subscriptions?path=/subreddits/mine/subscriber'
      )
      const response = await GET(request)

      expect(response.headers.get('Cache-Control')).toBe('no-store, max-age=0')
    })

    it('should set no-store cache headers on unauthenticated requests', async () => {
      mockGetSession.mockResolvedValue(null)

      const request = new NextRequest(
        'http://localhost:3000/api/reddit/subscriptions?path=/subreddits/mine/subscriber'
      )
      const response = await GET(request)

      expect(response.headers.get('Cache-Control')).toBe('no-store, max-age=0')
    })
  })
})
