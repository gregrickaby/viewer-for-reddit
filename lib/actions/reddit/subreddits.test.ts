// Mock reddit-context BEFORE imports
vi.mock('@/lib/auth/reddit-context', () => ({
  getRedditContext: vi.fn()
}))

// Partially mocked so a single test can simulate Next's dev-only
// "items over 2MB can not be cached" data-cache error on the first call
// while every other test uses the real circuit-breaker-backed fetch.
vi.mock('./_helpers', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./_helpers')>()
  return {
    ...actual,
    circuitProtectedFetch: vi.fn(actual.circuitProtectedFetch)
  }
})

// Mock Next.js headers
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

// Mock Next.js cache
vi.mock('next/cache', () => ({
  updateTag: vi.fn()
}))

import {type RedditContext, getRedditContext} from '@/lib/auth/reddit-context'
import {resetCircuitBreakerForTests} from '@/lib/utils/circuit-breaker'
import {http, HttpResponse, server} from '@/test-utils'
import {beforeEach, describe, expect, it, vi} from 'vitest'
import {circuitProtectedFetch} from './_helpers'
import {
  fetchSubredditInfo,
  fetchUserSubscriptions,
  toggleSubscription
} from './subreddits'

const mockGetRedditContext = vi.mocked(getRedditContext)
const mockCircuitProtectedFetch = vi.mocked(circuitProtectedFetch)

function createAuthContext(username = 'testuser'): RedditContext {
  return {
    headers: {
      'User-Agent': 'test-user-agent',
      Authorization: 'Bearer mock-token'
    },
    baseUrl: 'https://oauth.reddit.com',
    username
  }
}

describe('subreddits server actions', () => {
  beforeEach(() => {
    resetCircuitBreakerForTests()
    mockGetRedditContext.mockClear()
    mockGetRedditContext.mockResolvedValue(createAuthContext())
  })

  describe('fetchSubredditInfo', () => {
    it('fetches subreddit information', async () => {
      server.use(
        http.get('https://oauth.reddit.com/r/:subreddit/about.json', () => {
          return HttpResponse.json({
            data: {
              display_name: 'aww',
              subscribers: 37661216
            }
          })
        })
      )

      const info = await fetchSubredditInfo('aww')

      expect(info.display_name).toBe('aww')
      expect(info.subscribers).toBe(37661216)
    })

    it('handles 404 errors', async () => {
      server.use(
        http.get('https://oauth.reddit.com/r/:subreddit/about.json', () => {
          return new HttpResponse(null, {status: 404})
        })
      )

      await expect(fetchSubredditInfo('nonexistent')).rejects.toThrow(
        'Resource not found'
      )
    })

    it('fetches a user profile subreddit (u_ prefix)', async () => {
      server.use(
        http.get('https://oauth.reddit.com/r/:subreddit/about.json', () => {
          return HttpResponse.json({
            data: {
              display_name: 'u_Bella-Fiore',
              subscribers: 0
            }
          })
        })
      )

      const info = await fetchSubredditInfo('u_Bella-Fiore')

      expect(info.display_name).toBe('u_Bella-Fiore')
    })

    it('rejects an invalid subreddit name', async () => {
      await expect(fetchSubredditInfo('../admin')).rejects.toThrow(
        'Something went wrong.'
      )
    })
  })

  describe('fetchUserSubscriptions', () => {
    it('returns empty result when not authenticated', async () => {
      mockGetRedditContext.mockRejectedValue(new Error('Not authenticated'))

      const result = await fetchUserSubscriptions()

      expect(result).toEqual([])
    })

    it('fetches subscriptions when authenticated', async () => {
      const result = await fetchUserSubscriptions()

      expect(Array.isArray(result)).toBe(true)
    })

    it('returns empty result on error', async () => {
      server.use(
        http.get(
          'https://oauth.reddit.com/subreddits/mine/subscriber.json',
          () => {
            return new HttpResponse(null, {status: 500})
          }
        )
      )

      const result = await fetchUserSubscriptions()

      expect(result).toEqual([])
    })

    it('returns an empty array once repeated upstream failures open the circuit', async () => {
      server.use(
        http.get(
          'https://oauth.reddit.com/subreddits/mine/subscriber.json',
          () => {
            return new HttpResponse(null, {status: 500})
          }
        )
      )

      for (let i = 0; i < 5; i++) {
        await fetchUserSubscriptions()
      }

      const result = await fetchUserSubscriptions()

      expect(result).toEqual([])
    })

    it('retries uncached when the fetch cache rejects a large response', async () => {
      server.use(
        http.get(
          'https://oauth.reddit.com/subreddits/mine/subscriber.json',
          () =>
            HttpResponse.json({
              data: {
                children: [
                  {
                    data: {
                      display_name: 'programming',
                      display_name_prefixed: 'r/programming',
                      icon_img: '',
                      subscribers: 0
                    }
                  }
                ],
                after: null
              }
            })
        )
      )

      mockCircuitProtectedFetch.mockImplementationOnce(() => {
        throw new Error('items over 2MB can not be cached')
      })

      const result = await fetchUserSubscriptions()

      expect(result).toHaveLength(1)
      expect(result[0].subscribers).toBe(0)
    })

    it('fetches all pages and returns complete list', async () => {
      server.use(
        http.get(
          'https://oauth.reddit.com/subreddits/mine/subscriber.json',
          ({request}) => {
            const url = new URL(request.url)
            const after = url.searchParams.get('after')

            if (after === 'page2') {
              return HttpResponse.json({
                data: {
                  children: [
                    {
                      data: {
                        display_name: 'javascript',
                        display_name_prefixed: 'r/javascript',
                        icon_img: '',
                        subscribers: 2000
                      }
                    }
                  ],
                  after: null
                }
              })
            }

            return HttpResponse.json({
              data: {
                children: [
                  {
                    data: {
                      display_name: 'programming',
                      display_name_prefixed: 'r/programming',
                      icon_img: '',
                      subscribers: 5000
                    }
                  }
                ],
                after: 'page2'
              }
            })
          }
        )
      )

      const result = await fetchUserSubscriptions()

      expect(Array.isArray(result)).toBe(true)
      expect(result).toHaveLength(2)
      expect(result[0].name).toBe('programming')
      expect(result[1].name).toBe('javascript')
    })
  })

  describe('toggleSubscription', () => {
    it('rejects an invalid subreddit name', async () => {
      const result = await toggleSubscription('../admin', 'sub')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Something went wrong. Please try again.')
    })

    it('reports failure on a non-rate-limit error response', async () => {
      server.use(
        http.post('https://oauth.reddit.com/api/subscribe', () => {
          return new HttpResponse(null, {status: 400})
        })
      )

      const result = await toggleSubscription('programming', 'sub')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Something went wrong. Please try again.')
    })

    it('requires authentication', async () => {
      mockGetRedditContext.mockRejectedValue(new Error('Not authenticated'))

      const result = await toggleSubscription('programming', 'sub')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Something went wrong. Please try again.')
    })

    it('subscribes to subreddit when authenticated', async () => {
      const result = await toggleSubscription('programming', 'sub')

      expect(result.success).toBe(true)
    })

    it('handles 429 rate limit', async () => {
      server.use(
        http.post('https://oauth.reddit.com/api/subscribe', () => {
          return new HttpResponse(null, {status: 429})
        })
      )

      const result = await toggleSubscription('programming', 'sub')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Something went wrong. Please try again.')
    })
  })
})
