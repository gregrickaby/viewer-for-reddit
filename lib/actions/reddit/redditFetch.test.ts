/**
 * Tests for the unified Reddit API fetch wrapper.
 *
 * Mocks {@link getRedditContext} for auth context and uses MSW for HTTP responses.
 */

// Mock reddit-context BEFORE imports
vi.mock('@/lib/auth/reddit-context', () => ({
  getRedditContext: vi.fn()
}))

// Mock Datadog logger
vi.mock('@/lib/datadog/server', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn()
  }
}))

// Mock Next.js headers (used by getRequestMetadata in error path)
vi.mock('next/headers', () => ({
  headers: vi.fn(async () => ({
    get: vi.fn((name: string) => {
      const mockHeaders: Record<string, string> = {
        'user-agent': 'Mozilla/5.0 Test Browser',
        'x-forwarded-for': '127.0.0.1',
        referer: 'http://localhost:3000'
      }
      return mockHeaders[name] || null
    })
  }))
}))

import {type RedditContext, getRedditContext} from '@/lib/auth/reddit-context'
import {resetCircuitBreakerForTests} from '@/lib/utils/circuit-breaker'
import {
  AuthenticationError,
  CircuitOpenError,
  NotFoundError,
  RedditAPIError
} from '@/lib/utils/errors'
import {http, HttpResponse, server} from '@/test-utils'
import {beforeEach, describe, expect, it, vi} from 'vitest'
import {redditFetch} from './redditFetch'

const mockGetRedditContext = vi.mocked(getRedditContext)

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createAuthContext(): RedditContext {
  return {
    headers: {
      'User-Agent': 'test-user-agent',
      Authorization: 'Bearer mock-token'
    },
    baseUrl: 'https://oauth.reddit.com',
    username: 'testuser'
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('redditFetch', () => {
  beforeEach(() => {
    resetCircuitBreakerForTests()
    mockGetRedditContext.mockReset()
    mockGetRedditContext.mockResolvedValue(createAuthContext())
  })

  // -------------------------------------------------------------------------
  // URL construction
  // -------------------------------------------------------------------------

  describe('URL construction', () => {
    it('prepends baseUrl to relative path', async () => {
      server.use(
        http.get('https://oauth.reddit.com/r/popular/hot.json', () => {
          return HttpResponse.json({data: {children: []}})
        })
      )

      const result = await redditFetch<{data: {children: unknown[]}}>(
        '/r/popular/hot.json',
        {
          operation: 'fetchPosts'
        }
      )

      expect(result.data.children).toEqual([])
    })
  })

  // -------------------------------------------------------------------------
  // raw_json=1 for GET requests
  // -------------------------------------------------------------------------

  describe('raw_json=1', () => {
    it('adds raw_json=1 for GET requests', async () => {
      let capturedUrl = ''
      server.use(
        http.get('https://oauth.reddit.com/r/test/hot.json', ({request}) => {
          capturedUrl = request.url
          return HttpResponse.json({ok: true})
        })
      )

      await redditFetch('/r/test/hot.json', {operation: 'fetchPosts'})

      const url = new URL(capturedUrl)
      expect(url.searchParams.get('raw_json')).toBe('1')
    })

    it('does not add raw_json=1 for POST requests', async () => {
      let capturedUrl = ''
      server.use(
        http.post('https://oauth.reddit.com/api/vote', ({request}) => {
          capturedUrl = request.url
          return HttpResponse.json({ok: true})
        })
      )

      await redditFetch('/api/vote', {
        method: 'POST',
        operation: 'votePost'
      })

      const url = new URL(capturedUrl)
      expect(url.searchParams.get('raw_json')).toBeNull()
    })
  })

  // -------------------------------------------------------------------------
  // Search params merging
  // -------------------------------------------------------------------------

  describe('searchParams', () => {
    it('merges searchParams into the URL', async () => {
      let capturedUrl = ''
      server.use(
        http.get('https://oauth.reddit.com/r/popular/hot.json', ({request}) => {
          capturedUrl = request.url
          return HttpResponse.json({data: {children: []}})
        })
      )

      await redditFetch('/r/popular/hot.json', {
        operation: 'fetchPosts',
        searchParams: {limit: '25', after: 't3_abc'}
      })

      const url = new URL(capturedUrl)
      expect(url.searchParams.get('limit')).toBe('25')
      expect(url.searchParams.get('after')).toBe('t3_abc')
      expect(url.searchParams.get('raw_json')).toBe('1')
    })
  })

  // -------------------------------------------------------------------------
  // Error classification
  // -------------------------------------------------------------------------

  describe('error classification', () => {
    it('throws AuthenticationError on 401', async () => {
      server.use(
        http.get('https://oauth.reddit.com/r/test/hot.json', () => {
          return new HttpResponse('Unauthorized', {status: 401})
        })
      )

      await expect(
        redditFetch('/r/test/hot.json', {
          operation: 'fetchPosts',
          resource: 'test'
        })
      ).rejects.toThrow(AuthenticationError)
    })

    it('throws AuthenticationError on 403', async () => {
      server.use(
        http.get('https://oauth.reddit.com/r/private/hot.json', () => {
          return new HttpResponse('Forbidden', {status: 403})
        })
      )

      await expect(
        redditFetch('/r/private/hot.json', {
          operation: 'fetchPosts',
          resource: 'private'
        })
      ).rejects.toThrow(AuthenticationError)
    })

    it('throws NotFoundError on 404', async () => {
      server.use(
        http.get('https://oauth.reddit.com/r/nonexistent/hot.json', () => {
          return new HttpResponse('Not Found', {status: 404})
        })
      )

      await expect(
        redditFetch('/r/nonexistent/hot.json', {
          operation: 'fetchPosts',
          resource: 'nonexistent'
        })
      ).rejects.toThrow(NotFoundError)
    })

    it('throws RedditAPIError on 429', async () => {
      server.use(
        http.get('https://oauth.reddit.com/r/test/hot.json', () => {
          return new HttpResponse('Too Many Requests', {
            status: 429,
            headers: {'retry-after': '30'}
          })
        })
      )

      await expect(
        redditFetch('/r/test/hot.json', {
          operation: 'fetchPosts',
          resource: 'test'
        })
      ).rejects.toThrow(RedditAPIError)
    })

    it('throws RedditAPIError on other non-OK status codes', async () => {
      server.use(
        http.get('https://oauth.reddit.com/r/test/hot.json', () => {
          return new HttpResponse('Internal Server Error', {status: 500})
        })
      )

      await expect(
        redditFetch('/r/test/hot.json', {
          operation: 'fetchPosts',
          resource: 'test'
        })
      ).rejects.toThrow(RedditAPIError)
    })
  })

  // -------------------------------------------------------------------------
  // 401/403 retry with forced token refresh
  // -------------------------------------------------------------------------

  describe('401/403 retry with forced token refresh', () => {
    it('retries once with a forced refresh and succeeds if the retry succeeds', async () => {
      let callCount = 0
      server.use(
        http.get('https://oauth.reddit.com/user/testuser/about.json', () => {
          callCount++
          if (callCount === 1) {
            return new HttpResponse('Unauthorized', {status: 401})
          }
          return HttpResponse.json({data: {name: 'testuser'}})
        })
      )

      const result = await redditFetch<{data: {name: string}}>(
        '/user/testuser/about.json',
        {operation: 'fetchUserInfo', resource: 'testuser'}
      )

      expect(result.data.name).toBe('testuser')
      expect(callCount).toBe(2)
      expect(mockGetRedditContext).toHaveBeenCalledTimes(2)
      expect(mockGetRedditContext).toHaveBeenNthCalledWith(2, {
        forceRefresh: true
      })
    })

    it('throws AuthenticationError when the retry also 401s', async () => {
      let callCount = 0
      server.use(
        http.get('https://oauth.reddit.com/r/test/hot.json', () => {
          callCount++
          return new HttpResponse('Unauthorized', {status: 401})
        })
      )

      await expect(
        redditFetch('/r/test/hot.json', {
          operation: 'fetchPosts',
          resource: 'test'
        })
      ).rejects.toThrow(AuthenticationError)

      expect(callCount).toBe(2)
      expect(mockGetRedditContext).toHaveBeenCalledTimes(2)
    })

    it('does not retry on non-auth failures', async () => {
      let callCount = 0
      server.use(
        http.get('https://oauth.reddit.com/r/test/hot.json', () => {
          callCount++
          return new HttpResponse('Not Found', {status: 404})
        })
      )

      await expect(
        redditFetch('/r/test/hot.json', {
          operation: 'fetchPosts',
          resource: 'test'
        })
      ).rejects.toThrow(NotFoundError)

      expect(callCount).toBe(1)
      expect(mockGetRedditContext).toHaveBeenCalledTimes(1)
    })
  })

  // -------------------------------------------------------------------------
  // SSRF validation
  // -------------------------------------------------------------------------

  describe('SSRF validation', () => {
    it('rejects URLs targeting non-Reddit domains', async () => {
      mockGetRedditContext.mockResolvedValue({
        headers: {'User-Agent': 'test-user-agent'},
        baseUrl: 'https://evil.example.com',
        username: null
      })

      await expect(
        redditFetch('/r/test/hot.json', {operation: 'fetchPosts'})
      ).rejects.toThrow('Invalid request destination')
    })
  })

  // -------------------------------------------------------------------------
  // Cache configuration
  // -------------------------------------------------------------------------

  describe('cache configuration', () => {
    it('passes through successfully without cache options', async () => {
      server.use(
        http.get('https://oauth.reddit.com/api/v1/me', () => {
          return HttpResponse.json({name: 'testuser'})
        })
      )

      const result = await redditFetch<{name: string}>('/api/v1/me', {
        operation: 'fetchMe'
      })

      expect(result.name).toBe('testuser')
    })

    it('passes through successfully with cache options', async () => {
      server.use(
        http.get('https://oauth.reddit.com/r/popular/hot.json', () => {
          return HttpResponse.json({data: {children: []}})
        })
      )

      // Just verify no error; we cannot inspect Next.js fetch internals
      const result = await redditFetch<{data: {children: unknown[]}}>(
        '/r/popular/hot.json',
        {
          operation: 'fetchPosts',
          cache: {revalidate: 300, tags: ['posts']}
        }
      )

      expect(result.data.children).toEqual([])
    })
  })

  // -------------------------------------------------------------------------
  // Successful JSON parsing
  // -------------------------------------------------------------------------

  describe('successful responses', () => {
    it('parses JSON response body', async () => {
      const mockData = {
        data: {
          children: [{kind: 't3', data: {id: 'abc', title: 'Test Post'}}],
          after: 't3_xyz',
          before: null
        }
      }

      server.use(
        http.get('https://oauth.reddit.com/r/popular/hot.json', () => {
          return HttpResponse.json(mockData)
        })
      )

      const result = await redditFetch<typeof mockData>('/r/popular/hot.json', {
        operation: 'fetchPosts'
      })

      expect(result.data.children).toHaveLength(1)
      expect(result.data.children[0].data.title).toBe('Test Post')
      expect(result.data.after).toBe('t3_xyz')
    })
  })

  // -------------------------------------------------------------------------
  // Circuit breaker
  // -------------------------------------------------------------------------

  describe('circuit breaker', () => {
    it('throws CircuitOpenError once repeated upstream failures open the circuit', async () => {
      server.use(
        http.get('https://oauth.reddit.com/r/test/hot.json', () => {
          return new HttpResponse('Internal Server Error', {status: 500})
        })
      )

      for (let i = 0; i < 5; i++) {
        await expect(
          redditFetch('/r/test/hot.json', {
            operation: 'fetchPosts',
            resource: 'test'
          })
        ).rejects.toThrow(RedditAPIError)
      }

      await expect(
        redditFetch('/r/test/hot.json', {
          operation: 'fetchPosts',
          resource: 'test'
        })
      ).rejects.toThrow(CircuitOpenError)
    })

    it('does not count 401 toward the breaker (five 401s do not open it)', async () => {
      server.use(
        http.get('https://oauth.reddit.com/r/test/hot.json', () => {
          return new HttpResponse('Unauthorized', {status: 401})
        })
      )

      for (let i = 0; i < 5; i++) {
        await expect(
          redditFetch('/r/test/hot.json', {
            operation: 'fetchPosts',
            resource: 'test'
          })
        ).rejects.toThrow(AuthenticationError)
      }

      server.use(
        http.get('https://oauth.reddit.com/r/popular/hot.json', () => {
          return HttpResponse.json({data: {children: []}})
        })
      )

      // Still closed: a 6th, unrelated successful call goes through normally.
      const result = await redditFetch<{data: {children: unknown[]}}>(
        '/r/popular/hot.json',
        {operation: 'fetchPosts'}
      )
      expect(result.data.children).toEqual([])
    })
  })
})
