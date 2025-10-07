import {checkRateLimit} from '@/lib/auth/rateLimit'
import {getSession} from '@/lib/auth/session'
import {logError} from '@/lib/utils/logging/logError'
import {validateOrigin} from '@/lib/utils/validation/validateOrigin'
import {NextRequest} from 'next/server'
import {beforeEach, describe, expect, it, vi} from 'vitest'
import {POST} from './route'

vi.mock('@/lib/auth/session')
vi.mock('@/lib/auth/rateLimit')
vi.mock('@/lib/utils/logging/logError')
vi.mock('@/lib/utils/validation/validateOrigin')

const mockGetSession = vi.mocked(getSession)
const mockCheckRateLimit = vi.mocked(checkRateLimit)
const mockLogError = vi.mocked(logError)
const mockValidateOrigin = vi.mocked(validateOrigin)

describe('/api/reddit/subscribe', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn()
    mockValidateOrigin.mockReturnValue(true)
    mockCheckRateLimit.mockResolvedValue(null)
  })

  describe('POST', () => {
    it('should return 403 if origin validation fails', async () => {
      mockValidateOrigin.mockReturnValue(false)

      const request = new NextRequest(
        'http://localhost:3000/api/reddit/subscribe',
        {
          method: 'POST',
          body: JSON.stringify({
            action: 'sub',
            sr_name: 'technology'
          })
        }
      )

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data).toEqual({error: 'Forbidden'})
      expect(response.headers.get('Cache-Control')).toBe('no-store, max-age=0')
    })

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
        'http://localhost:3000/api/reddit/subscribe',
        {
          method: 'POST',
          body: JSON.stringify({
            action: 'sub',
            sr_name: 'technology'
          })
        }
      )

      const response = await POST(request)

      expect(response.status).toBe(429)
      expect(mockCheckRateLimit).toHaveBeenCalledWith(request)
    })

    it('should return 401 if user is not authenticated', async () => {
      mockGetSession.mockResolvedValue(null)

      const request = new NextRequest(
        'http://localhost:3000/api/reddit/subscribe',
        {
          method: 'POST',
          body: JSON.stringify({
            action: 'sub',
            sr_name: 'technology'
          })
        }
      )

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data).toEqual({error: 'Unauthorized'})
    })

    it('should return 400 if action is missing', async () => {
      mockGetSession.mockResolvedValue({
        accessToken: 'test-token',
        refreshToken: 'refresh-token',
        expiresAt: Date.now() + 3600000,
        username: 'testuser',
        sessionVersion: 1
      })

      const request = new NextRequest(
        'http://localhost:3000/api/reddit/subscribe',
        {
          method: 'POST',
          body: JSON.stringify({
            sr_name: 'technology'
          })
        }
      )

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toEqual({
        error: 'Missing required fields: action and sr_name'
      })
      expect(mockLogError).toHaveBeenCalledWith(
        'Invalid subscribe request: missing required fields',
        expect.objectContaining({
          component: 'subscribeApiRoute',
          action: 'validateRequest'
        })
      )
    })

    it('should return 400 if sr_name is missing', async () => {
      mockGetSession.mockResolvedValue({
        accessToken: 'test-token',
        refreshToken: 'refresh-token',
        expiresAt: Date.now() + 3600000,
        username: 'testuser',
        sessionVersion: 1
      })

      const request = new NextRequest(
        'http://localhost:3000/api/reddit/subscribe',
        {
          method: 'POST',
          body: JSON.stringify({
            action: 'sub'
          })
        }
      )

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toEqual({
        error: 'Missing required fields: action and sr_name'
      })
    })

    it('should return 400 if action is invalid', async () => {
      mockGetSession.mockResolvedValue({
        accessToken: 'test-token',
        refreshToken: 'refresh-token',
        expiresAt: Date.now() + 3600000,
        username: 'testuser',
        sessionVersion: 1
      })

      const request = new NextRequest(
        'http://localhost:3000/api/reddit/subscribe',
        {
          method: 'POST',
          body: JSON.stringify({
            action: 'invalid',
            sr_name: 'technology'
          })
        }
      )

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toEqual({error: 'Invalid action. Must be "sub" or "unsub"'})
      expect(mockLogError).toHaveBeenCalledWith(
        'Invalid subscribe request: invalid action value',
        expect.objectContaining({
          component: 'subscribeApiRoute',
          action: 'validateRequest'
        })
      )
    })

    it('should successfully subscribe to a subreddit', async () => {
      mockGetSession.mockResolvedValue({
        accessToken: 'test-token',
        refreshToken: 'refresh-token',
        expiresAt: Date.now() + 3600000,
        username: 'testuser',
        sessionVersion: 1
      })

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true
      })
      global.fetch = mockFetch

      const request = new NextRequest(
        'http://localhost:3000/api/reddit/subscribe',
        {
          method: 'POST',
          body: JSON.stringify({
            action: 'sub',
            sr_name: 'technology'
          })
        }
      )

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({
        success: true,
        action: 'sub',
        sr_name: 'technology'
      })

      expect(mockFetch).toHaveBeenCalledWith(
        'https://oauth.reddit.com/api/subscribe',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
            'Content-Type': 'application/x-www-form-urlencoded'
          })
        })
      )
    })

    it('should successfully unsubscribe from a subreddit', async () => {
      mockGetSession.mockResolvedValue({
        accessToken: 'test-token',
        refreshToken: 'refresh-token',
        expiresAt: Date.now() + 3600000,
        username: 'testuser',
        sessionVersion: 1
      })

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true
      })
      global.fetch = mockFetch

      const request = new NextRequest(
        'http://localhost:3000/api/reddit/subscribe',
        {
          method: 'POST',
          body: JSON.stringify({
            action: 'unsub',
            sr_name: 'technology'
          })
        }
      )

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({
        success: true,
        action: 'unsub',
        sr_name: 'technology'
      })
    })

    it('should handle Reddit API errors', async () => {
      mockGetSession.mockResolvedValue({
        accessToken: 'test-token',
        refreshToken: 'refresh-token',
        expiresAt: Date.now() + 3600000,
        username: 'testuser',
        sessionVersion: 1
      })

      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: async () => 'Reddit API error'
      })
      global.fetch = mockFetch

      const request = new NextRequest(
        'http://localhost:3000/api/reddit/subscribe',
        {
          method: 'POST',
          body: JSON.stringify({
            action: 'sub',
            sr_name: 'technology'
          })
        }
      )

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({error: 'Failed to update subscription'})
      expect(mockLogError).toHaveBeenCalledWith(
        'Reddit API subscribe request failed',
        expect.objectContaining({
          component: 'subscribeApiRoute',
          action: 'redditApiCall',
          status: 500,
          sr_name: 'technology',
          actionType: 'sub'
        })
      )
    })

    it('should handle unexpected errors', async () => {
      mockGetSession.mockRejectedValue(new Error('Session error'))

      const request = new NextRequest(
        'http://localhost:3000/api/reddit/subscribe',
        {
          method: 'POST',
          body: JSON.stringify({
            action: 'sub',
            sr_name: 'technology'
          })
        }
      )

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({error: 'Internal server error'})
      expect(mockLogError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          component: 'subscribeApiRoute',
          action: 'handleRequest'
        })
      )
    })
  })
})
