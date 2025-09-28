import {NextRequest} from 'next/server'
import {afterAll, beforeAll, beforeEach, describe, expect, it, vi} from 'vitest'
import {GET} from './route'

// Mock the dependencies
vi.mock('@/lib/actions/redditToken', () => ({
  getRedditToken: vi.fn()
}))

vi.mock('@/lib/utils/logError', () => ({
  logError: vi.fn()
}))

// Setup mocks
const mockGetRedditToken = vi.mocked(
  (await import('@/lib/actions/redditToken')).getRedditToken
)
const mockLogError = vi.mocked((await import('@/lib/utils/logError')).logError)

// Mock global fetch
const mockFetch = vi.fn()

describe('Reddit API Route', () => {
  beforeAll(() => {
    global.fetch = mockFetch
  })

  afterAll(() => {
    vi.restoreAllMocks()
  })

  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('NODE_ENV', 'development')
    mockGetRedditToken.mockResolvedValue({
      access_token: 'reddit-token',
      token_type: 'bearer',
      expires_in: 3600,
      scope: '*'
    })
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({data: 'test'})
    })
  })

  describe('Origin Validation', () => {
    it('should allow requests from localhost in development', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/reddit?path=/test',
        {
          headers: {
            origin: 'http://localhost:3000'
          }
        }
      )
      const response = await GET(request)
      expect(response.status).toBe(200)
    })

    it('should allow requests with localhost referer in development', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/reddit?path=/test',
        {
          headers: {
            referer: 'http://localhost:3000/some-page'
          }
        }
      )
      const response = await GET(request)
      expect(response.status).toBe(200)
    })

    it('should allow requests without proper origin or referer in development', async () => {
      vi.stubEnv('NODE_ENV', 'development')

      const request = new NextRequest(
        'http://localhost:3000/api/reddit?path=/test'
      )
      const response = await GET(request)

      expect(response.status).toBe(200)
    })

    it('should block requests without proper origin or referer', async () => {
      vi.stubEnv('NODE_ENV', 'production')

      const request = new NextRequest(
        'http://localhost:3000/api/reddit?path=/test'
      )
      const response = await GET(request)

      expect(response.status).toBe(403)
      const data = await response.json()
      expect(data).toEqual({error: 'Forbidden'})
    })

    it('should allow requests from allowed domain in production', async () => {
      vi.stubEnv('NODE_ENV', 'production')
      vi.stubEnv('ALLOWED_HOST', 'example.com')

      const request = new NextRequest(
        'http://localhost:3000/api/reddit?path=/test',
        {
          headers: {
            origin: 'https://example.com'
          }
        }
      )
      const response = await GET(request)
      expect(response.status).toBe(200)
    })

    it('should allow requests from preview deployment subdomains', async () => {
      vi.stubEnv('NODE_ENV', 'production')
      vi.stubEnv('ALLOWED_HOST', 'example.com')

      const request = new NextRequest(
        'http://localhost:3000/api/reddit?path=/test',
        {
          headers: {
            origin: 'https://preview-branch-123.example.com'
          }
        }
      )
      const response = await GET(request)
      expect(response.status).toBe(200)
    })

    it('should allow requests from Coolify FQDN in production', async () => {
      vi.stubEnv('NODE_ENV', 'production')
      vi.stubEnv('COOLIFY_FQDN', 'pr-123.example.com')
      vi.stubEnv('ALLOWED_HOST', '')

      const request = new NextRequest(
        'https://pr-123.example.com/api/reddit?path=/test',
        {
          headers: {
            origin: 'https://pr-123.example.com'
          }
        }
      )
      const response = await GET(request)
      expect(response.status).toBe(200)
    })

    it('should block requests from unauthorized origins in production', async () => {
      vi.stubEnv('NODE_ENV', 'production')
      vi.stubEnv('ALLOWED_HOST', 'example.com')

      const request = new NextRequest(
        'http://localhost:3000/api/reddit?path=/test',
        {
          headers: {
            origin: 'https://malicious-site.com'
          }
        }
      )
      const response = await GET(request)

      expect(response.status).toBe(403)
      const data = await response.json()
      expect(data).toEqual({error: 'Forbidden'})
    })
  })

  describe('Path validation', () => {
    it('should require path parameter', async () => {
      const request = new NextRequest('http://localhost:3000/api/reddit', {
        headers: {
          origin: 'http://localhost:3000'
        }
      })
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Path parameter is required')
    })
  })

  describe('Reddit API integration', () => {
    it('should forward successful Reddit API responses', async () => {
      const mockData = {data: {children: []}}
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockData)
      })

      const request = new NextRequest(
        'http://localhost:3000/api/reddit?path=/r/programming/hot.json',
        {
          headers: {
            origin: 'http://localhost:3000'
          }
        }
      )
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(mockData)
      expect(mockFetch).toHaveBeenCalledWith(
        'https://oauth.reddit.com/r/programming/hot.json',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer reddit-token',
            'User-Agent': 'web-app:viewer-for-reddit:* (by Greg Rickaby)'
          })
        })
      )
    })

    it('should handle Reddit API errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        headers: new Headers(),
        json: () => Promise.resolve({error: 'Not found'})
      })

      const request = new NextRequest(
        'http://localhost:3000/api/reddit?path=/r/nonexistent',
        {
          headers: {
            origin: 'http://localhost:3000'
          }
        }
      )
      const response = await GET(request)

      expect(response.status).toBe(404)
      expect(mockLogError).toHaveBeenCalled()
    })

    it('should handle Reddit token errors', async () => {
      mockGetRedditToken.mockResolvedValueOnce(null)

      const request = new NextRequest(
        'http://localhost:3000/api/reddit?path=/test',
        {
          headers: {
            origin: 'http://localhost:3000'
          }
        }
      )
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('No Reddit token available')
    })

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const request = new NextRequest(
        'http://localhost:3000/api/reddit?path=/test',
        {
          headers: {
            origin: 'http://localhost:3000'
          }
        }
      )
      const response = await GET(request)

      expect(response.status).toBe(500)
      expect(mockLogError).toHaveBeenCalled()
    })
  })
})
