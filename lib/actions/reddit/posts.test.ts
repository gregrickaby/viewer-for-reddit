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
import {fetchPost, fetchPosts, fetchUserPosts} from './posts'

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

describe('posts server actions', () => {
  beforeEach(() => {
    mockGetRedditContext.mockClear()
    mockGetRedditContext.mockResolvedValue(createAuthContext())
  })

  describe('fetchPosts', () => {
    it('fetches posts from a subreddit', async () => {
      server.use(
        http.get('https://oauth.reddit.com/r/:subreddit/:sort.json', () => {
          return HttpResponse.json({
            data: {
              children: [
                {
                  kind: 't3',
                  data: {
                    id: 'test1',
                    title: 'Test Post 1',
                    author: 'author1',
                    score: 100
                  }
                },
                {
                  kind: 't3',
                  data: {
                    id: 'test2',
                    title: 'Test Post 2',
                    author: 'author2',
                    score: 200
                  }
                }
              ],
              after: 't3_next'
            }
          })
        })
      )

      const {posts, after} = await fetchPosts('popular', 'hot')

      expect(posts.length).toBeGreaterThan(0)
      expect(posts[0]).toHaveProperty('title')
      expect(after).toBeDefined()
    })

    it('fetches authenticated home feed', async () => {
      server.use(
        http.get('https://oauth.reddit.com/hot.json', () => {
          return HttpResponse.json({
            data: {
              children: [{kind: 't3', data: {id: 'home1', title: 'Home Post'}}],
              after: null
            }
          })
        })
      )

      const {posts} = await fetchPosts('home', 'hot')

      expect(posts.length).toBeGreaterThan(0)
    })

    it('handles 404 errors', async () => {
      server.use(
        http.get('https://oauth.reddit.com/r/:subreddit/:sort.json', () => {
          return new HttpResponse(null, {status: 404})
        }),
        http.get('https://www.reddit.com/r/:subreddit/:sort.json', () => {
          return new HttpResponse(null, {status: 404})
        })
      )

      await expect(fetchPosts('nonexistent', 'hot')).rejects.toThrow(
        'Resource not found'
      )
    })

    it('handles 429 rate limit', async () => {
      server.use(
        http.get('https://oauth.reddit.com/r/:subreddit/:sort.json', () => {
          return new HttpResponse(null, {status: 429})
        }),
        http.get('https://www.reddit.com/r/:subreddit/:sort.json', () => {
          return new HttpResponse(null, {status: 429})
        })
      )

      await expect(fetchPosts('popular', 'hot')).rejects.toThrow(
        'Rate limit exceeded'
      )
    })

    it('includes time filter parameter for top sort', async () => {
      let requestUrl = ''
      server.use(
        http.get(
          'https://oauth.reddit.com/r/:subreddit/:sort.json',
          ({request}) => {
            requestUrl = request.url
            return HttpResponse.json({
              data: {
                children: [
                  {kind: 't3', data: {id: 'test1', title: 'Top Post'}}
                ],
                after: null
              }
            })
          }
        )
      )

      await fetchPosts('popular', 'top', undefined, 'week')

      expect(requestUrl).toContain('t=week')
    })

    it('includes time filter parameter for controversial sort', async () => {
      let requestUrl = ''
      server.use(
        http.get(
          'https://oauth.reddit.com/r/:subreddit/:sort.json',
          ({request}) => {
            requestUrl = request.url
            return HttpResponse.json({
              data: {
                children: [
                  {
                    kind: 't3',
                    data: {id: 'test1', title: 'Controversial Post'}
                  }
                ],
                after: null
              }
            })
          }
        )
      )

      await fetchPosts('popular', 'controversial', undefined, 'month')

      expect(requestUrl).toContain('t=month')
    })

    it('does not include time filter for hot sort', async () => {
      let requestUrl = ''
      server.use(
        http.get(
          'https://oauth.reddit.com/r/:subreddit/:sort.json',
          ({request}) => {
            requestUrl = request.url
            return HttpResponse.json({
              data: {
                children: [
                  {kind: 't3', data: {id: 'test1', title: 'Hot Post'}}
                ],
                after: null
              }
            })
          }
        )
      )

      await fetchPosts('popular', 'hot', undefined, 'week')

      expect(requestUrl).not.toContain('t=week')
    })

    it('does not include time filter when undefined for top sort', async () => {
      let requestUrl = ''
      server.use(
        http.get(
          'https://oauth.reddit.com/r/:subreddit/:sort.json',
          ({request}) => {
            requestUrl = request.url
            return HttpResponse.json({
              data: {
                children: [
                  {kind: 't3', data: {id: 'test1', title: 'Top Post'}}
                ],
                after: null
              }
            })
          }
        )
      )

      await fetchPosts('popular', 'top')

      expect(requestUrl).toContain('popular/top.json')
      expect(requestUrl).not.toMatch(/[?&]t=/)
    })
  })

  describe('fetchPost', () => {
    it('fetches a post with comments', async () => {
      server.use(
        http.get(
          'https://oauth.reddit.com/r/:subreddit/comments/:postId.json',
          () => {
            return HttpResponse.json([
              {
                data: {
                  children: [
                    {
                      kind: 't3',
                      data: {
                        id: 'abc123',
                        title: 'Test Post',
                        author: 'testuser'
                      }
                    }
                  ]
                }
              },
              {
                data: {
                  children: [
                    {
                      kind: 't1',
                      data: {id: 'c1', body: 'Test comment', author: 'user1'}
                    }
                  ]
                }
              }
            ])
          }
        )
      )

      const {post, comments} = await fetchPost('programming', 'abc123', 'best')

      expect(post.id).toBe('abc123')
      expect(comments.length).toBeGreaterThan(0)
      expect(comments[0]).toHaveProperty('body')
    })

    it('handles 404 errors', async () => {
      server.use(
        http.get(
          'https://oauth.reddit.com/r/:subreddit/comments/:postId.json',
          () => {
            return new HttpResponse(null, {status: 404})
          }
        ),
        http.get(
          'https://www.reddit.com/r/:subreddit/comments/:postId.json',
          () => {
            return new HttpResponse(null, {status: 404})
          }
        )
      )

      await expect(fetchPost('AskReddit', 'missing', 'best')).rejects.toThrow(
        'Resource not found'
      )
    })
  })

  describe('fetchUserPosts', () => {
    it('fetches user submitted posts with default sort', async () => {
      let requestUrl = ''
      server.use(
        http.get(
          'https://oauth.reddit.com/user/:username/submitted.json',
          ({request}) => {
            requestUrl = request.url
            return HttpResponse.json({
              data: {
                children: [
                  {
                    kind: 't3',
                    data: {
                      id: 'post1',
                      title: 'Test Post',
                      author: 'testuser'
                    }
                  }
                ],
                after: 't3_after'
              }
            })
          }
        ),
        http.get(
          'https://www.reddit.com/user/:username/submitted.json',
          ({request}) => {
            requestUrl = request.url
            return HttpResponse.json({
              data: {
                children: [
                  {
                    kind: 't3',
                    data: {
                      id: 'post1',
                      title: 'Test Post',
                      author: 'testuser'
                    }
                  }
                ],
                after: 't3_after'
              }
            })
          }
        )
      )

      const {posts, after} = await fetchUserPosts('testuser')

      expect(posts.length).toBeGreaterThan(0)
      expect(posts[0].author).toBe('testuser')
      expect(after).toBeDefined()
      expect(requestUrl).toContain('sort=new')
    })

    it('fetches user posts with custom sort', async () => {
      let requestUrl = ''
      const handler = ({request}: {request: Request}) => {
        requestUrl = request.url
        return HttpResponse.json({
          data: {
            children: [
              {
                kind: 't3',
                data: {
                  id: 'post1',
                  title: 'Top Post',
                  author: 'testuser'
                }
              }
            ],
            after: null
          }
        })
      }

      server.use(
        http.get(
          'https://oauth.reddit.com/user/:username/submitted.json',
          handler
        ),
        http.get(
          'https://www.reddit.com/user/:username/submitted.json',
          handler
        )
      )

      const {posts} = await fetchUserPosts('testuser', 'top')

      expect(posts.length).toBeGreaterThan(0)
      expect(requestUrl).toContain('sort=top')
    })

    it('includes time filter for top sort', async () => {
      let requestUrl = ''
      const handler = ({request}: {request: Request}) => {
        requestUrl = request.url
        return HttpResponse.json({
          data: {
            children: [
              {
                kind: 't3',
                data: {
                  id: 'post1',
                  title: 'Top Post This Week',
                  author: 'testuser'
                }
              }
            ],
            after: null
          }
        })
      }

      server.use(
        http.get(
          'https://oauth.reddit.com/user/:username/submitted.json',
          handler
        ),
        http.get(
          'https://www.reddit.com/user/:username/submitted.json',
          handler
        )
      )

      await fetchUserPosts('testuser', 'top', undefined, 'week')

      expect(requestUrl).toContain('sort=top')
      expect(requestUrl).toContain('t=week')
    })

    it('handles pagination with after cursor', async () => {
      let requestUrl = ''
      const handler = ({request}: {request: Request}) => {
        requestUrl = request.url
        return HttpResponse.json({
          data: {
            children: [
              {
                kind: 't3',
                data: {
                  id: 'post2',
                  title: 'Next Page Post',
                  author: 'testuser'
                }
              }
            ],
            after: 't3_next'
          }
        })
      }

      server.use(
        http.get(
          'https://oauth.reddit.com/user/:username/submitted.json',
          handler
        ),
        http.get(
          'https://www.reddit.com/user/:username/submitted.json',
          handler
        )
      )

      const {posts, after} = await fetchUserPosts('testuser', 'new', 't3_after')

      expect(posts.length).toBeGreaterThan(0)
      expect(after).toBe('t3_next')
      expect(requestUrl).toContain('after=t3_after')
    })

    it('handles 404 errors', async () => {
      server.use(
        http.get(
          'https://oauth.reddit.com/user/:username/submitted.json',
          () => {
            return new HttpResponse(null, {status: 404})
          }
        )
      )

      await expect(fetchUserPosts('nonexistent')).rejects.toThrow(
        'Resource not found'
      )
    })
  })
})
