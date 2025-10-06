import {checkRateLimit} from '@/lib/auth/rateLimit'
import {getSession} from '@/lib/auth/session'
import {logError} from '@/lib/utils/logError'
import {validateOrigin} from '@/lib/utils/validateOrigin'
import {server} from '@/test-utils/msw/server'
import {http, HttpResponse} from 'msw'
import {NextRequest} from 'next/server'
import {beforeEach, describe, expect, it, vi} from 'vitest'
import {GET} from './route'

vi.mock('@/lib/auth/session')
vi.mock('@/lib/auth/rateLimit')
vi.mock('@/lib/utils/logError')
vi.mock('@/lib/utils/validateOrigin')

const mockGetSession = vi.mocked(getSession)
const mockCheckRateLimit = vi.mocked(checkRateLimit)
const mockLogError = vi.mocked(logError)
const mockValidateOrigin = vi.mocked(validateOrigin)

describe('GET /api/reddit/me', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockValidateOrigin.mockReturnValue(true)
    mockCheckRateLimit.mockResolvedValue(null)
  })

  describe('Origin validation', () => {
    it('should return 403 if origin validation fails', async () => {
      mockValidateOrigin.mockReturnValue(false)

      const request = new NextRequest(
        'http://localhost:3000/api/reddit/me?path=/user/test/m/feed/hot.json'
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
        'http://localhost:3000/api/reddit/me?path=/user/test/m/feed/hot.json'
      )
      const response = await GET(request)

      expect(response.status).toBe(429)
      expect(mockCheckRateLimit).toHaveBeenCalledWith(request)
    })
  })

  describe('Path validation', () => {
    it('should return 400 if path parameter is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/reddit/me')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toEqual({error: 'Path parameter is required'})
      expect(response.headers.get('Cache-Control')).toBe('no-store, max-age=0')
      expect(mockLogError).toHaveBeenCalledWith(
        'Missing required path parameter',
        expect.objectContaining({
          component: 'redditMeApiRoute',
          action: 'validatePath'
        })
      )
    })

    it('should return 400 if path is invalid', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/reddit/me?path=//evil.com/api'
      )
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toEqual({error: 'Invalid path parameter'})
      expect(response.headers.get('Cache-Control')).toBe('no-store, max-age=0')
      expect(mockLogError).toHaveBeenCalledWith(
        'Invalid or dangerous Reddit API path',
        expect.objectContaining({
          component: 'redditMeApiRoute',
          action: 'validatePath',
          path: '//evil.com/api'
        })
      )
    })
  })

  describe('Authentication', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockGetSession.mockResolvedValue(null)

      const request = new NextRequest(
        'http://localhost:3000/api/reddit/me?path=/user/test/m/feed/hot.json'
      )
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data).toEqual({error: 'Authentication required'})
      expect(response.headers.get('Cache-Control')).toBe('no-store, max-age=0')
    })

    it('should return 401 if session has no access token', async () => {
      mockGetSession.mockResolvedValue({
        accessToken: '',
        refreshToken: 'refresh-token',
        expiresAt: Date.now() + 3600000,
        username: 'testuser',
        sessionVersion: 1
      })

      const request = new NextRequest(
        'http://localhost:3000/api/reddit/me?path=/user/test/m/feed/hot.json'
      )
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data).toEqual({error: 'Authentication required'})
    })
  })

  describe('Successful requests', () => {
    beforeEach(() => {
      mockGetSession.mockResolvedValue({
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
        expiresAt: Date.now() + 3600000,
        username: 'testuser',
        sessionVersion: 1
      })
    })

    it('should proxy request to Reddit API with user token', async () => {
      const mockData = {
        data: {
          children: [{kind: 't3', data: {id: '123', title: 'Test Post'}}]
        }
      }

      server.use(
        http.get('https://oauth.reddit.com/user/test/m/feed/hot.json', () => {
          return HttpResponse.json(mockData)
        })
      )

      const request = new NextRequest(
        'http://localhost:3000/api/reddit/me?path=/user/test/m/feed/hot.json'
      )
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(mockData)
      // Custom feeds are cached for 5 minutes (300 seconds)
      expect(response.headers.get('Cache-Control')).toBe(
        'private, max-age=300, stale-while-revalidate=600'
      )
    })

    it('should handle custom feed paths', async () => {
      const mockData = {data: {children: []}}

      server.use(
        http.get(
          'https://oauth.reddit.com/user/username/m/customfeed/hot.json',
          () => {
            return HttpResponse.json(mockData)
          }
        )
      )

      const request = new NextRequest(
        'http://localhost:3000/api/reddit/me?path=/user/username/m/customfeed/hot.json'
      )
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(mockData)
    })
  })

  describe('Reddit API errors', () => {
    beforeEach(() => {
      mockGetSession.mockResolvedValue({
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
        expiresAt: Date.now() + 3600000,
        username: 'testuser',
        sessionVersion: 1
      })
    })

    it('should handle 404 from Reddit API', async () => {
      server.use(
        http.get(
          'https://oauth.reddit.com/user/test/m/notfound/hot.json',
          () => {
            return new HttpResponse(null, {status: 404})
          }
        )
      )

      const request = new NextRequest(
        'http://localhost:3000/api/reddit/me?path=/user/test/m/notfound/hot.json'
      )
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data).toEqual({error: 'Reddit API error'})
      expect(response.headers.get('Cache-Control')).toBe('no-store, max-age=0')
      expect(mockLogError).toHaveBeenCalledWith(
        'Reddit /me API request failed',
        expect.objectContaining({
          component: 'redditMeApiRoute',
          action: 'fetchReddit',
          status: 404
        })
      )
    })

    it('should handle 403 from Reddit API', async () => {
      server.use(
        http.get(
          'https://oauth.reddit.com/user/test/m/private/hot.json',
          () => {
            return new HttpResponse(null, {status: 403})
          }
        )
      )

      const request = new NextRequest(
        'http://localhost:3000/api/reddit/me?path=/user/test/m/private/hot.json'
      )
      const response = await GET(request)

      expect(response.status).toBe(403)
      expect(mockLogError).toHaveBeenCalled()
    })
  })

  describe('Error handling', () => {
    beforeEach(() => {
      mockGetSession.mockResolvedValue({
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
        expiresAt: Date.now() + 3600000,
        username: 'testuser',
        sessionVersion: 1
      })
    })

    it('should handle network errors', async () => {
      server.use(
        http.get('https://oauth.reddit.com/user/test/m/feed/hot.json', () => {
          return HttpResponse.error()
        })
      )

      const request = new NextRequest(
        'http://localhost:3000/api/reddit/me?path=/user/test/m/feed/hot.json'
      )
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({error: 'Internal server error'})
      expect(response.headers.get('Cache-Control')).toBe('no-store, max-age=0')
      expect(mockLogError).toHaveBeenCalledWith(
        'Reddit /me API proxy error',
        expect.objectContaining({
          component: 'redditMeApiRoute',
          action: 'proxyRequest'
        })
      )
    })

    it('should handle JSON parse errors', async () => {
      server.use(
        http.get('https://oauth.reddit.com/user/test/m/feed/hot.json', () => {
          return new HttpResponse('invalid json', {
            headers: {'Content-Type': 'application/json'}
          })
        })
      )

      const request = new NextRequest(
        'http://localhost:3000/api/reddit/me?path=/user/test/m/feed/hot.json'
      )
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({error: 'Internal server error'})
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

    it('should set cache headers based on endpoint type', async () => {
      server.use(
        http.get('https://oauth.reddit.com/user/test/m/feed/hot.json', () => {
          return HttpResponse.json({data: {children: []}})
        })
      )

      const request = new NextRequest(
        'http://localhost:3000/api/reddit/me?path=/user/test/m/feed/hot.json'
      )
      const response = await GET(request)

      // Custom feeds are cached for 5 minutes
      expect(response.headers.get('Cache-Control')).toBe(
        'private, max-age=300, stale-while-revalidate=600'
      )
    })

    it('should set no-store cache headers on errors', async () => {
      server.use(
        http.get('https://oauth.reddit.com/user/test/m/feed/hot.json', () => {
          return new HttpResponse(null, {status: 500})
        })
      )

      const request = new NextRequest(
        'http://localhost:3000/api/reddit/me?path=/user/test/m/feed/hot.json'
      )
      const response = await GET(request)

      expect(response.headers.get('Cache-Control')).toBe('no-store, max-age=0')
    })
  })
})
