import {
  executeRedditRequest,
  validateRedditRequest
} from '@/lib/utils/redditProxyHelpers'
import {NextRequest} from 'next/server'
import {beforeEach, describe, expect, it, vi} from 'vitest'

describe('redditProxyHelpers', () => {
  describe('validateRedditRequest', () => {
    let mockRequest: NextRequest

    beforeEach(() => {
      mockRequest = new NextRequest(
        'http://localhost:3000/api/reddit?path=/r/programming/hot.json',
        {
          headers: {
            origin: 'http://localhost:3000',
            referer: 'http://localhost:3000'
          }
        }
      )
    })

    it('should validate a valid request successfully', () => {
      const result = validateRedditRequest(mockRequest, 'testComponent')

      expect(result.isValid).toBe(true)
      expect(result.path).toBe('/r/programming/hot.json')
      expect(result.response).toBeUndefined()
    })

    it('should reject request with invalid origin', () => {
      const invalidRequest = new NextRequest(
        'http://localhost:3000/api/reddit?path=/r/test',
        {
          headers: {
            origin: 'http://evil.com',
            referer: 'http://evil.com'
          }
        }
      )

      const result = validateRedditRequest(invalidRequest, 'testComponent')

      expect(result.isValid).toBe(false)
      expect(result.response).toBeDefined()
      const json = result.response!.json()
      expect(json).resolves.toEqual({error: 'Forbidden'})
    })

    it('should reject request without path parameter', () => {
      const noPathRequest = new NextRequest(
        'http://localhost:3000/api/reddit',
        {
          headers: {
            origin: 'http://localhost:3000',
            referer: 'http://localhost:3000'
          }
        }
      )

      const result = validateRedditRequest(noPathRequest, 'testComponent')

      expect(result.isValid).toBe(false)
      expect(result.response).toBeDefined()
      const json = result.response!.json()
      expect(json).resolves.toEqual({error: 'Path parameter is required'})
    })

    it('should reject request with invalid path', () => {
      const invalidPathRequest = new NextRequest(
        'http://localhost:3000/api/reddit?path=https://evil.com/api',
        {
          headers: {
            origin: 'http://localhost:3000',
            referer: 'http://localhost:3000'
          }
        }
      )

      const result = validateRedditRequest(invalidPathRequest, 'testComponent')

      expect(result.isValid).toBe(false)
      expect(result.response).toBeDefined()
      const json = result.response!.json()
      expect(json).resolves.toEqual({error: 'Invalid path parameter'})
    })

    it('should reject path with absolute URL', () => {
      const absoluteUrlRequest = new NextRequest(
        'http://localhost:3000/api/reddit?path=http://example.com/data',
        {
          headers: {
            origin: 'http://localhost:3000',
            referer: 'http://localhost:3000'
          }
        }
      )

      const result = validateRedditRequest(absoluteUrlRequest, 'testComponent')

      expect(result.isValid).toBe(false)
      expect(result.path).toBeUndefined()
    })

    it('should accept valid subreddit paths', () => {
      const validPaths = [
        '/r/programming/hot.json',
        '/r/test/new.json',
        '/r/AskReddit/top.json',
        '/user/testuser/about.json',
        '/api/v1/me'
      ]

      for (const path of validPaths) {
        const request = new NextRequest(
          `http://localhost:3000/api/reddit?path=${encodeURIComponent(path)}`,
          {
            headers: {
              origin: 'http://localhost:3000',
              referer: 'http://localhost:3000'
            }
          }
        )

        const result = validateRedditRequest(request, 'testComponent')
        expect(result.isValid).toBe(true)
        expect(result.path).toBe(path)
      }
    })
  })

  describe('executeRedditRequest', () => {
    const mockToken = 'mock_access_token_123'
    const componentName = 'testComponent'

    beforeEach(() => {
      global.fetch = vi.fn()
    })

    it('should execute a successful Reddit API request', async () => {
      const mockData = {
        kind: 'Listing',
        data: {
          children: [{kind: 't3', data: {id: 'abc123', title: 'Test Post'}}]
        }
      }

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
        headers: new Headers()
      } as Response)

      const response = await executeRedditRequest(
        '/r/programming/hot.json',
        mockToken,
        componentName
      )

      expect(global.fetch).toHaveBeenCalledWith(
        'https://oauth.reddit.com/r/programming/hot.json',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: `Bearer ${mockToken}`
          })
        })
      )

      const json = await response.json()
      expect(json).toEqual(mockData)
    })

    it('should handle Reddit API error responses', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        headers: new Headers(),
        json: async () => ({error: 'Not found'})
      } as Response)

      const response = await executeRedditRequest(
        '/r/nonexistent/hot.json',
        mockToken,
        componentName
      )

      expect(response.status).toBe(404)
      const json = await response.json()
      expect(json).toEqual({error: 'Reddit API error'})
    })

    it('should handle rate limit headers in error response', async () => {
      const headers = new Headers()
      headers.set('x-ratelimit-remaining', '0')
      headers.set('x-ratelimit-reset', '1234567890')

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        headers,
        json: async () => ({error: 'Rate limited'})
      } as Response)

      const response = await executeRedditRequest(
        '/r/test/hot.json',
        mockToken,
        componentName
      )

      expect(response.status).toBe(429)
      const json = await response.json()
      expect(json).toEqual({error: 'Reddit API error'})
    })

    it('should handle fetch exceptions', async () => {
      vi.mocked(global.fetch).mockRejectedValueOnce(new Error('Network error'))

      const response = await executeRedditRequest(
        '/r/test/hot.json',
        mockToken,
        componentName
      )

      expect(response.status).toBe(500)
      const json = await response.json()
      expect(json).toEqual({error: 'Internal server error'})
    })

    it('should include User-Agent header in request', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({data: 'test'}),
        headers: new Headers()
      } as Response)

      await executeRedditRequest('/r/test/hot.json', mockToken, componentName)

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'User-Agent': expect.any(String)
          })
        })
      )
    })

    it('should handle different HTTP status codes', async () => {
      const statusCodes = [
        {status: 401, expected: 401},
        {status: 403, expected: 403},
        {status: 500, expected: 500},
        {status: 502, expected: 502},
        {status: 503, expected: 503}
      ]

      for (const {status, expected} of statusCodes) {
        vi.mocked(global.fetch).mockResolvedValueOnce({
          ok: false,
          status,
          statusText: 'Error',
          headers: new Headers(),
          json: async () => ({error: 'Error'})
        } as Response)

        const response = await executeRedditRequest(
          '/r/test/hot.json',
          mockToken,
          componentName
        )

        expect(response.status).toBe(expected)
      }
    })

    it('should handle non-Error exceptions', async () => {
      vi.mocked(global.fetch).mockRejectedValueOnce('String error')

      const response = await executeRedditRequest(
        '/r/test/hot.json',
        mockToken,
        componentName
      )

      expect(response.status).toBe(500)
      const json = await response.json()
      expect(json).toEqual({error: 'Internal server error'})
    })
  })
})
