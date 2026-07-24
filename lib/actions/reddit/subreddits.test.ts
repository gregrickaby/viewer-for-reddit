// Mock reddit-context BEFORE imports
vi.mock('@/lib/auth/reddit-context', () => ({
  getRedditContext: vi.fn()
}))

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
  revalidatePath: vi.fn()
}))

import {type RedditContext, getRedditContext} from '@/lib/auth/reddit-context'
import {http, HttpResponse, server} from '@/test-utils'
import {beforeEach, describe, expect, it, vi} from 'vitest'
import {
  fetchSubredditInfo,
  fetchUserSubscriptions,
  toggleSubscription
} from './subreddits'

const mockGetRedditContext = vi.mocked(getRedditContext)

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
