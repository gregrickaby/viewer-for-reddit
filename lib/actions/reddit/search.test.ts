// Mock rate-limit-state BEFORE imports
vi.mock('@/lib/utils/rate-limit-state', () => ({
  recordRateLimit: vi.fn(),
  resetRateLimit: vi.fn(),
  waitForRateLimit: vi.fn(async () => {})
}))

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
  searchReddit,
  searchSubreddit,
  searchSubreddits,
  searchSubredditsAndUsers
} from './search'

const mockGetRedditContext = vi.mocked(getRedditContext)

function createAuthContext(username = 'testuser'): RedditContext {
  return {
    headers: {
      'User-Agent': 'test-user-agent',
      Authorization: 'Bearer mock-token'
    },
    baseUrl: 'https://oauth.reddit.com',
    isAuthenticated: true,
    username
  }
}

function createAnonContext(): RedditContext {
  return {
    headers: {
      'User-Agent': 'test-user-agent'
    },
    baseUrl: 'https://www.reddit.com',
    isAuthenticated: false,
    username: null
  }
}

describe('search server actions', () => {
  beforeEach(() => {
    mockGetRedditContext.mockClear()
    mockGetRedditContext.mockResolvedValue(createAuthContext())
  })

  describe('searchReddit', () => {
    it('searches reddit for posts', async () => {
      server.use(
        http.get('https://oauth.reddit.com/search.json', () => {
          return HttpResponse.json({
            data: {
              children: [
                {
                  kind: 't3',
                  data: {
                    id: 'search1',
                    title: 'NextJS Post',
                    author: 'user1',
                    score: 50
                  }
                },
                {
                  kind: 't3',
                  data: {
                    id: 'search2',
                    title: 'Another NextJS Post',
                    author: 'user2',
                    score: 75
                  }
                }
              ],
              after: 't3_after'
            }
          })
        })
      )

      const {posts, after} = await searchReddit('nextjs')

      expect(posts.length).toBeGreaterThan(0)
      expect(after).toBeDefined()
    })

    it('handles errors', async () => {
      server.use(
        http.get('https://oauth.reddit.com/search.json', () => {
          return new HttpResponse(null, {status: 500})
        })
      )

      await expect(searchReddit('test')).rejects.toThrow(
        'Something went wrong.'
      )
    })
  })

  describe('searchSubreddit', () => {
    it('searches within a specific subreddit', async () => {
      server.use(
        http.get('https://oauth.reddit.com/r/:subreddit/search.json', () => {
          return HttpResponse.json({
            data: {
              children: [
                {
                  kind: 't3',
                  data: {
                    id: 'result1',
                    title: 'TypeScript Guide',
                    author: 'programmer',
                    score: 100,
                    subreddit: 'programming'
                  }
                },
                {
                  kind: 't3',
                  data: {
                    id: 'result2',
                    title: 'Advanced TypeScript',
                    author: 'dev',
                    score: 85,
                    subreddit: 'programming'
                  }
                }
              ],
              after: 't3_next'
            }
          })
        })
      )

      const {posts, after} = await searchSubreddit('programming', 'typescript')

      expect(posts.length).toBe(2)
      expect(posts[0].title).toBe('TypeScript Guide')
      expect(after).toBe('t3_next')
    })

    it('handles pagination with after cursor', async () => {
      server.use(
        http.get('https://oauth.reddit.com/r/:subreddit/search.json', () => {
          return HttpResponse.json({
            data: {
              children: [
                {
                  kind: 't3',
                  data: {
                    id: 'page2_1',
                    title: 'Second Page Result',
                    author: 'user',
                    score: 50
                  }
                }
              ],
              after: null
            }
          })
        })
      )

      const {posts, after} = await searchSubreddit(
        'programming',
        'typescript',
        't3_after'
      )

      expect(posts.length).toBe(1)
      expect(after).toBeNull()
    })

    it('supports different sort options', async () => {
      let capturedUrl = ''
      server.use(
        http.get(
          'https://oauth.reddit.com/r/:subreddit/search.json',
          ({request}) => {
            capturedUrl = request.url
            return HttpResponse.json({
              data: {children: [], after: null}
            })
          }
        )
      )

      await searchSubreddit('programming', 'typescript', undefined, 'new')

      expect(capturedUrl).toContain('sort=new')
      expect(capturedUrl).toContain('restrict_sr=true')
    })

    it('includes time filter for top sort', async () => {
      let capturedUrl = ''
      server.use(
        http.get(
          'https://oauth.reddit.com/r/:subreddit/search.json',
          ({request}) => {
            capturedUrl = request.url
            return HttpResponse.json({
              data: {children: [], after: null}
            })
          }
        )
      )

      await searchSubreddit(
        'programming',
        'typescript',
        undefined,
        'top',
        'week'
      )

      expect(capturedUrl).toContain('sort=top')
      expect(capturedUrl).toContain('t=week')
    })

    it('validates subreddit name', async () => {
      await expect(
        searchSubreddit('invalid@subreddit', 'query')
      ).rejects.toThrow('Something went wrong.')
    })

    it('validates query length', async () => {
      const longQuery = 'a'.repeat(513)
      await expect(searchSubreddit('programming', longQuery)).rejects.toThrow(
        'Something went wrong.'
      )
    })

    it('handles API errors', async () => {
      server.use(
        http.get('https://oauth.reddit.com/r/:subreddit/search.json', () => {
          return new HttpResponse(null, {status: 404})
        })
      )

      await expect(searchSubreddit('nonexistent', 'query')).rejects.toThrow(
        'Resource not found'
      )
    })
  })

  describe('searchSubreddits', () => {
    it('returns empty array for short queries', async () => {
      const result = await searchSubreddits('a')

      expect(result.success).toBe(true)
      expect(result.data).toEqual([])
    })

    it('searches for subreddits', async () => {
      server.use(
        http.get(
          'https://oauth.reddit.com/api/subreddit_autocomplete_v2.json',
          () => {
            return HttpResponse.json({
              data: {
                children: [
                  {
                    data: {
                      display_name: 'technology',
                      display_name_prefixed: 'r/technology',
                      subscribers: 1000000,
                      icon_img: 'https://example.com/tech.png',
                      over18: false
                    }
                  },
                  {
                    data: {
                      display_name: 'tech',
                      display_name_prefixed: 'r/tech',
                      subscribers: 500000,
                      icon_img: 'https://example.com/tech2.png',
                      over18: false
                    }
                  }
                ]
              }
            })
          }
        )
      )

      const result = await searchSubreddits('tech')

      expect(result.success).toBe(true)
      expect(result.data.length).toBeGreaterThan(0)
      expect(result.data[0]).toHaveProperty('name')
    })

    it('handles errors gracefully', async () => {
      server.use(
        http.get(
          'https://oauth.reddit.com/api/subreddit_autocomplete_v2.json',
          () => {
            return new HttpResponse(null, {status: 500})
          }
        )
      )

      const result = await searchSubreddits('tech')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Something went wrong. Please try again.')
    })

    it('handles 429 rate limit for non-authenticated users with login prompt', async () => {
      mockGetRedditContext.mockResolvedValue(createAnonContext())

      server.use(
        http.get(
          'https://www.reddit.com/api/subreddit_autocomplete_v2.json',
          () => {
            return new HttpResponse(null, {status: 429})
          }
        )
      )

      const result = await searchSubreddits('tech')

      expect(result.success).toBe(false)
      expect(result.error).toBe(
        'Reddit rate limit exceeded. Log in to continue.'
      )
    })

    it('handles 429 rate limit for authenticated users', async () => {
      server.use(
        http.get(
          'https://oauth.reddit.com/api/subreddit_autocomplete_v2.json',
          () => {
            return new HttpResponse(null, {status: 429})
          }
        )
      )

      const result = await searchSubreddits('tech')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Reddit rate limit exceeded. Try again later.')
    })
  })

  describe('searchSubredditsAndUsers', () => {
    it('returns empty data for short queries', async () => {
      const result = await searchSubredditsAndUsers('a')

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(0)
    })

    it('returns empty data for empty query', async () => {
      const result = await searchSubredditsAndUsers('')

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(0)
    })

    it('returns both subreddits and users', async () => {
      server.use(
        http.get(
          'https://oauth.reddit.com/api/subreddit_autocomplete_v2.json',
          () => {
            return HttpResponse.json({
              data: {
                children: [
                  {
                    data: {
                      display_name: 'programming',
                      display_name_prefixed: 'r/programming',
                      icon_img: '',
                      community_icon: '',
                      subscribers: 5000000,
                      over18: false
                    }
                  },
                  {
                    data: {
                      display_name: 'testuser',
                      display_name_prefixed: 'u/testuser',
                      icon_img: 'https://example.com/avatar.png',
                      community_icon: '',
                      subscribers: 0,
                      over18: false
                    }
                  }
                ]
              }
            })
          }
        )
      )

      const result = await searchSubredditsAndUsers('test')

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(2)

      const subreddit = result.data.find((item) => item.type === 'subreddit')
      expect(subreddit?.name).toBe('programming')
      expect(subreddit?.displayName).toBe('r/programming')

      const user = result.data.find((item) => item.type === 'user')
      expect(user?.name).toBe('testuser')
      expect(user?.displayName).toBe('u/testuser')
    })

    it('returns rate limit error for authenticated user on 429', async () => {
      server.use(
        http.get(
          'https://oauth.reddit.com/api/subreddit_autocomplete_v2.json',
          () => new HttpResponse(null, {status: 429})
        )
      )

      const result = await searchSubredditsAndUsers('test')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Reddit rate limit exceeded. Try again later.')
    })

    it('returns rate limit login prompt for unauthenticated user on 429', async () => {
      mockGetRedditContext.mockResolvedValue(createAnonContext())

      server.use(
        http.get(
          'https://www.reddit.com/api/subreddit_autocomplete_v2.json',
          () => new HttpResponse(null, {status: 429})
        )
      )

      const result = await searchSubredditsAndUsers('test')

      expect(result.success).toBe(false)
      expect(result.error).toBe(
        'Reddit rate limit exceeded. Log in to continue.'
      )
    })

    it('returns error on network failure', async () => {
      server.use(
        http.get(
          'https://oauth.reddit.com/api/subreddit_autocomplete_v2.json',
          () => new HttpResponse(null, {status: 500})
        )
      )

      const result = await searchSubredditsAndUsers('test')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Something went wrong. Please try again.')
    })
  })
})
