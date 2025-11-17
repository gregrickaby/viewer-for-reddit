import {
  executeRedditRequest,
  validateRedditRequest
} from '@/lib/utils/api/baseQuery/redditProxyHelpers'
import {http, HttpResponse} from 'msw'
import {NextRequest} from 'next/server'
import {beforeEach, describe, expect, it} from 'vitest'
import {server} from '@/test-utils'

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

    it('should execute a successful Reddit API request', async () => {
      const mockData = {
        kind: 'Listing',
        data: {
          children: [{kind: 't3', data: {id: 'abc123', title: 'Test Post'}}]
        }
      }

      server.use(
        http.get('https://oauth.reddit.com/r/programming/hot.json', () => {
          return HttpResponse.json(mockData)
        })
      )

      const response = await executeRedditRequest(
        '/r/programming/hot.json',
        mockToken,
        componentName
      )

      const json = await response.json()
      expect(json).toEqual(mockData)
    })

    it('should handle Reddit API error responses', async () => {
      server.use(
        http.get('https://oauth.reddit.com/r/nonexistent/hot.json', () => {
          return HttpResponse.json({error: 'Not found'}, {status: 404})
        })
      )

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
      server.use(
        http.get('https://oauth.reddit.com/r/test/hot.json', () => {
          return HttpResponse.json(
            {error: 'Rate limited'},
            {
              status: 429,
              headers: {
                'x-ratelimit-remaining': '0',
                'x-ratelimit-reset': '1234567890'
              }
            }
          )
        })
      )

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
      server.use(
        http.get('https://oauth.reddit.com/r/test/hot.json', () => {
          return HttpResponse.error()
        })
      )

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
      let receivedHeaders: Headers | undefined

      server.use(
        http.get('https://oauth.reddit.com/r/test/hot.json', ({request}) => {
          receivedHeaders = request.headers
          return HttpResponse.json({data: 'test'})
        })
      )

      await executeRedditRequest('/r/test/hot.json', mockToken, componentName)

      expect(receivedHeaders?.get('User-Agent')).toBeDefined()
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
        server.use(
          http.get('https://oauth.reddit.com/r/test/hot.json', () => {
            return HttpResponse.json({error: 'Error'}, {status})
          })
        )

        const response = await executeRedditRequest(
          '/r/test/hot.json',
          mockToken,
          componentName
        )

        expect(response.status).toBe(expected)
      }
    })

    it('should handle non-Error exceptions', async () => {
      server.use(
        http.get('https://oauth.reddit.com/r/test/hot.json', () => {
          throw new Error('Non-standard error')
        })
      )

      const response = await executeRedditRequest(
        '/r/test/hot.json',
        mockToken,
        componentName
      )

      expect(response.status).toBe(500)
      const json = await response.json()
      expect(json).toEqual({error: 'Reddit API error'})
    })
  })
})
