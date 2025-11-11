import {checkRateLimit} from '@/lib/auth/rateLimit'
import {getSession} from '@/lib/auth/session'
import {logError} from '@/lib/utils/logging/logError'
import {validateOrigin} from '@/lib/utils/validation/errors/validateOrigin'
import {NextRequest, NextResponse} from 'next/server'
import {beforeEach, describe, expect, it, vi} from 'vitest'
import {POST} from './route'

vi.mock('@/lib/auth/session')
vi.mock('@/lib/auth/rateLimit')
vi.mock('@/lib/utils/logging/logError')
vi.mock('@/lib/utils/validation/errors/validateOrigin')

const mockGetSession = vi.mocked(getSession)
const mockCheckRateLimit = vi.mocked(checkRateLimit)
const mockLogError = vi.mocked(logError)
const mockValidateOrigin = vi.mocked(validateOrigin)

describe('/api/reddit/save', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    globalThis.fetch = vi.fn()
    mockValidateOrigin.mockReturnValue(true)
    mockCheckRateLimit.mockResolvedValue(null)
  })

  describe('POST', () => {
    it('should reject requests with invalid origin', async () => {
      mockValidateOrigin.mockReturnValue(false)

      const request = new NextRequest('http://localhost:3000/api/reddit/save', {
        method: 'POST',
        body: JSON.stringify({id: 't3_abc123', save: true})
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data).toEqual({error: 'Forbidden'})
    })

    it('should reject requests when rate limited', async () => {
      const rateLimitResponse = NextResponse.json(
        {error: 'Too many requests'},
        {status: 429}
      )
      mockCheckRateLimit.mockResolvedValue(rateLimitResponse)

      const request = new NextRequest('http://localhost:3000/api/reddit/save', {
        method: 'POST',
        body: JSON.stringify({id: 't3_abc123', save: true})
      })

      const response = await POST(request)

      expect(response.status).toBe(429)
    })

    it('should reject requests without authentication', async () => {
      mockGetSession.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/reddit/save', {
        method: 'POST',
        body: JSON.stringify({id: 't3_abc123', save: true})
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data).toEqual({error: 'Unauthorized'})
    })

    it('should reject requests with missing id', async () => {
      mockGetSession.mockResolvedValue({
        accessToken: 'test-token',
        refreshToken: 'refresh-token',
        expiresAt: Date.now() + 3600000,
        username: 'testuser',
        sessionVersion: 1
      })

      const request = new NextRequest('http://localhost:3000/api/reddit/save', {
        method: 'POST',
        body: JSON.stringify({save: true})
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toEqual({error: 'Missing required fields: id and save'})
      expect(mockLogError).toHaveBeenCalledWith(
        'Invalid save request: missing required fields',
        expect.objectContaining({
          component: 'saveApiRoute',
          action: 'validateRequest'
        })
      )
    })

    it('should reject requests with missing save boolean', async () => {
      mockGetSession.mockResolvedValue({
        accessToken: 'test-token',
        refreshToken: 'refresh-token',
        expiresAt: Date.now() + 3600000,
        username: 'testuser',
        sessionVersion: 1
      })

      const request = new NextRequest('http://localhost:3000/api/reddit/save', {
        method: 'POST',
        body: JSON.stringify({id: 't3_abc123'})
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toEqual({error: 'Missing required fields: id and save'})
    })

    it('should reject requests with invalid id format', async () => {
      mockGetSession.mockResolvedValue({
        accessToken: 'test-token',
        refreshToken: 'refresh-token',
        expiresAt: Date.now() + 3600000,
        username: 'testuser',
        sessionVersion: 1
      })

      const request = new NextRequest('http://localhost:3000/api/reddit/save', {
        method: 'POST',
        body: JSON.stringify({id: 't1_abc123', save: true}) // t1_ is comment, not post
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toEqual({
        error: 'Invalid id format. Must be a post id (t3_xxx)'
      })
      expect(mockLogError).toHaveBeenCalledWith(
        'Invalid save request: invalid id format',
        expect.objectContaining({
          component: 'saveApiRoute',
          action: 'validateRequest',
          id: 't1_abc123'
        })
      )
    })

    it('should successfully save a post', async () => {
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
      globalThis.fetch = mockFetch

      const request = new NextRequest('http://localhost:3000/api/reddit/save', {
        method: 'POST',
        body: JSON.stringify({
          id: 't3_abc123',
          save: true
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({
        success: true,
        id: 't3_abc123',
        saved: true
      })

      expect(mockFetch).toHaveBeenCalledWith(
        'https://oauth.reddit.com/api/save',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
            'Content-Type': 'application/x-www-form-urlencoded'
          })
        })
      )
    })

    it('should successfully unsave a post', async () => {
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
      globalThis.fetch = mockFetch

      const request = new NextRequest('http://localhost:3000/api/reddit/save', {
        method: 'POST',
        body: JSON.stringify({
          id: 't3_abc123',
          save: false
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({
        success: true,
        id: 't3_abc123',
        saved: false
      })

      expect(mockFetch).toHaveBeenCalledWith(
        'https://oauth.reddit.com/api/unsave',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
            'Content-Type': 'application/x-www-form-urlencoded'
          })
        })
      )
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
      globalThis.fetch = mockFetch

      const request = new NextRequest('http://localhost:3000/api/reddit/save', {
        method: 'POST',
        body: JSON.stringify({
          id: 't3_abc123',
          save: true
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({error: 'Failed to save/unsave post'})
      expect(mockLogError).toHaveBeenCalledWith(
        'Reddit API save request failed',
        expect.objectContaining({
          component: 'saveApiRoute',
          action: 'redditApiCall',
          status: 500,
          id: 't3_abc123',
          saveAction: true
        })
      )
    })

    it('should handle internal server errors', async () => {
      mockGetSession.mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost:3000/api/reddit/save', {
        method: 'POST',
        body: JSON.stringify({
          id: 't3_abc123',
          save: true
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({error: 'Internal server error'})
      expect(mockLogError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          component: 'saveApiRoute',
          action: 'handleRequest'
        })
      )
    })
  })
})
