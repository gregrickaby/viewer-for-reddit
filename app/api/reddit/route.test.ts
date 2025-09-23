/**
 * @vitest-environment node
 */
import {NextRequest} from 'next/server'
import {vi, describe, it, expect, beforeEach, afterEach} from 'vitest'

// Mock the Reddit token action before importing the route
const mockGetRedditToken = vi.fn()
vi.mock('@/lib/actions/redditToken', () => ({
  getRedditToken: mockGetRedditToken
}))

// Mock fetch for Reddit API calls
global.fetch = vi.fn()
const mockFetch = vi.mocked(fetch)

// Now import the route handler
const {GET} = await import('./route')

// Helper function to create a mock NextRequest
function createMockRequest(url: string, headers: Record<string, string> = {}) {
  return new NextRequest(url, {
    method: 'GET',
    headers: new Headers(headers)
  })
}

// Helper function to create mock Reddit API response
function createMockRedditResponse(
  data: any,
  status = 200,
  headers: Record<string, string> = {}
) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    headers: new Headers(headers),
    json: () => Promise.resolve(data)
  } as Response)
}

describe('/api/reddit route security validations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock successful token response by default
    mockGetRedditToken.mockResolvedValue({
      access_token: 'mock_token',
      token_type: 'bearer',
      expires_in: 3600,
      scope: 'read'
    })

    // Mock successful Reddit API response by default
    mockFetch.mockImplementation(() =>
      createMockRedditResponse({data: {children: []}})
    )

    // Spy on console methods to suppress logs during tests
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Path Parameter Validation', () => {
    it('should reject requests without path parameter', async () => {
      const request = createMockRequest('http://localhost:3000/api/reddit')

      const response = await GET(request)

      expect(response.status).toBe(400)
      const responseData = await response.json()
      expect(responseData.error).toBe('Path parameter is required')
    })

    it('should reject requests with empty path parameter', async () => {
      const request = createMockRequest(
        'http://localhost:3000/api/reddit?path='
      )

      const response = await GET(request)

      expect(response.status).toBe(400)
      const responseData = await response.json()
      expect(responseData.error).toBe('Path parameter is required')
    })
  })

  describe('Path Traversal Protection', () => {
    it('should reject paths not starting with /', async () => {
      const request = createMockRequest(
        'http://localhost:3000/api/reddit?path=r/test/hot.json'
      )

      const response = await GET(request)

      expect(response.status).toBe(400)
      const responseData = await response.json()
      expect(responseData.error).toBe('Invalid path format')
    })

    it('should reject paths containing ..', async () => {
      const request = createMockRequest(
        'http://localhost:3000/api/reddit?path=/r/../admin/secret'
      )

      const response = await GET(request)

      expect(response.status).toBe(400)
      const responseData = await response.json()
      expect(responseData.error).toBe('Invalid path format')
    })

    it('should reject paths containing double slashes', async () => {
      const request = createMockRequest(
        'http://localhost:3000/api/reddit?path=/r//test/hot.json'
      )

      const response = await GET(request)

      expect(response.status).toBe(400)
      const responseData = await response.json()
      expect(responseData.error).toBe('Invalid path format')
    })

    it('should reject complex path traversal attempts', async () => {
      const maliciousPaths = [
        '/r/test/../../../etc/passwd',
        '/r/test/./../../admin',
        '/r/test//../../secret'
      ]

      for (const maliciousPath of maliciousPaths) {
        const request = createMockRequest(
          `http://localhost:3000/api/reddit?path=${encodeURIComponent(
            maliciousPath
          )}`
        )

        const response = await GET(request)
        expect(response.status).toBe(400)
        const responseData = await response.json()
        expect(responseData.error).toMatch(/Invalid (path format|Reddit API path)/)
      }
    })
  })

  describe('Reddit API Path Validation', () => {
    it('should accept valid subreddit paths', async () => {
      const validPaths = [
        '/r/programming/hot.json',
        '/r/test123/new.json',
        '/r/multi+subreddit/top.json'
      ]

      for (const validPath of validPaths) {
        const request = createMockRequest(
          `http://localhost:3000/api/reddit?path=${validPath}`
        )

        const response = await GET(request)
        expect(response.status).toBe(200)
      }
    })

    it('should accept valid autocomplete API paths', async () => {
      const validPaths = [
        '/api/subreddit_autocomplete_v2',
        '/api/subreddit_autocomplete_v2?query=test'
      ]

      for (const validPath of validPaths) {
        const request = createMockRequest(
          `http://localhost:3000/api/reddit?path=${validPath}`
        )

        const response = await GET(request)
        expect(response.status).toBe(200)
      }
    })

    it('should accept valid popular subreddits path', async () => {
      const request = createMockRequest(
        'http://localhost:3000/api/reddit?path=/subreddits/popular.json'
      )

      const response = await GET(request)
      expect(response.status).toBe(200)
    })

    it('should reject invalid Reddit API paths', async () => {
      const invalidPaths = [
        '/admin/secret',
        '/user/profile',
        '/api/private',
        '/oauth/token',
        '/dashboard',
        '/r/',
        '/random/endpoint'
      ]

      for (const invalidPath of invalidPaths) {
        const request = createMockRequest(
          `http://localhost:3000/api/reddit?path=${invalidPath}`
        )

        const response = await GET(request)
        expect(response.status).toBe(400)
        const responseData = await response.json()
        expect(responseData.error).toBe('Invalid Reddit API path')
      }
    })
  })

  describe('Authentication Error Handling', () => {
    it('should return 401 when no token is available', async () => {
      mockGetRedditToken.mockResolvedValue(null)

      const request = createMockRequest(
        'http://localhost:3000/api/reddit?path=/r/test/hot.json'
      )

      const response = await GET(request)

      expect(response.status).toBe(401)
      const responseData = await response.json()
      expect(responseData.error).toBe('No Reddit token available')
    })

    it('should return 401 when token has no access_token', async () => {
      mockGetRedditToken.mockResolvedValue({
        access_token: '',
        token_type: 'bearer',
        expires_in: 3600,
        scope: 'read'
      })

      const request = createMockRequest(
        'http://localhost:3000/api/reddit?path=/r/test/hot.json'
      )

      const response = await GET(request)

      expect(response.status).toBe(401)
      const responseData = await response.json()
      expect(responseData.error).toBe('No Reddit token available')
    })
  })

  describe('Reddit API Error Handling', () => {
    it('should handle Reddit API 429 rate limit errors', async () => {
      mockFetch.mockImplementation(() =>
        createMockRedditResponse(
          {error: 'Too Many Requests'},
          429,
          {'retry-after': '120'}
        )
      )

      const request = createMockRequest(
        'http://localhost:3000/api/reddit?path=/r/test/hot.json'
      )

      const response = await GET(request)

      expect(response.status).toBe(429)
      const responseData = await response.json()
      expect(responseData.error).toBe(
        'Reddit API rate limit exceeded. Please try again later.'
      )
      expect(response.headers.get('Retry-After')).toBe('120')
    })

    it('should handle Reddit API 404 errors', async () => {
      mockFetch.mockImplementation(() =>
        createMockRedditResponse({error: 'Not Found'}, 404)
      )

      const request = createMockRequest(
        'http://localhost:3000/api/reddit?path=/r/nonexistent/hot.json'
      )

      const response = await GET(request)

      expect(response.status).toBe(404)
      const responseData = await response.json()
      expect(responseData.error).toBe(
        'The requested Reddit resource was not found.'
      )
    })

    it('should handle other Reddit API errors', async () => {
      mockFetch.mockImplementation(() =>
        createMockRedditResponse({error: 'Forbidden'}, 403)
      )

      const request = createMockRequest(
        'http://localhost:3000/api/reddit?path=/r/private/hot.json'
      )

      const response = await GET(request)

      expect(response.status).toBe(403)
      const responseData = await response.json()
      expect(responseData.error).toBe('Reddit API error: Error')
    })
  })

  describe('CORS Headers', () => {
    it('should set secure CORS headers in production', async () => {
      vi.stubEnv('NODE_ENV', 'production')

      const request = createMockRequest(
        'http://localhost:3000/api/reddit?path=/r/test/hot.json',
        {origin: 'https://reddit-viewer.com'}
      )

      const response = await GET(request)

      expect(response.headers.get('Access-Control-Allow-Origin')).toBe(
        'https://reddit-viewer.com'
      )
      expect(response.headers.get('Access-Control-Allow-Methods')).toBe('GET')
      expect(response.headers.get('Access-Control-Allow-Headers')).toBe(
        'Content-Type'
      )

      // Security headers
      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff')
      expect(response.headers.get('X-Frame-Options')).toBe('DENY')
      expect(response.headers.get('X-XSS-Protection')).toBe('1; mode=block')

      vi.unstubAllEnvs()
    })
  })

  describe('Successful Requests', () => {
    it('should forward successful Reddit API responses', async () => {
      const mockData = {
        data: {
          children: [
            {
              data: {
                title: 'Test Post',
                url: 'https://example.com'
              }
            }
          ]
        }
      }

      mockFetch.mockImplementation(() =>
        createMockRedditResponse(mockData, 200)
      )

      const request = createMockRequest(
        'http://localhost:3000/api/reddit?path=/r/test/hot.json'
      )

      const response = await GET(request)

      expect(response.status).toBe(200)
      const responseData = await response.json()
      expect(responseData).toEqual(mockData)
    })

    it('should make Reddit API request with correct headers', async () => {
      const request = createMockRequest(
        'http://localhost:3000/api/reddit?path=/r/test/hot.json'
      )

      await GET(request)

      expect(mockFetch).toHaveBeenCalledWith(
        'https://oauth.reddit.com/r/test/hot.json',
        {
          headers: {
            Authorization: 'Bearer mock_token',
            'User-Agent': 'Viewer for Reddit by /u/gregoryrickaby'
          }
        }
      )
    })
  })
})