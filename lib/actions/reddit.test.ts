import {getSession} from '@/lib/auth/session'
import type {SessionData} from '@/lib/types/reddit'
import {http, HttpResponse, server} from '@/test-utils'
import type {IronSession} from 'iron-session'
import {beforeEach, describe, expect, it, vi} from 'vitest'
import {
  fetchMultireddits,
  fetchPost,
  fetchPosts,
  fetchSavedPosts,
  fetchSubredditInfo,
  fetchUserInfo,
  fetchUserPosts,
  fetchUserSubscriptions,
  savePost,
  searchReddit,
  searchSubreddits,
  toggleSubscription,
  votePost
} from './reddit'

// Mock session module
vi.mock('@/lib/auth/session', () => ({
  getSession: vi.fn()
}))

const mockGetSession = vi.mocked(getSession)

// Helper to create mock session
function createMockSession(
  data: Partial<SessionData> = {}
): IronSession<SessionData> {
  return {
    accessToken: data.accessToken || '',
    refreshToken: data.refreshToken || '',
    expiresAt: data.expiresAt || 0,
    username: data.username || '',
    userId: data.userId || '',
    save: vi.fn().mockResolvedValue(undefined),
    destroy: vi.fn(),
    updateConfig: vi.fn()
  } as IronSession<SessionData>
}

describe('reddit server actions', () => {
  beforeEach(() => {
    mockGetSession.mockClear()
    mockGetSession.mockResolvedValue(createMockSession())
  })

  describe('fetchPosts', () => {
    it('fetches posts from a subreddit', async () => {
      mockGetSession.mockResolvedValue(
        createMockSession({
          accessToken: 'mock-token'
        })
      )

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
      mockGetSession.mockResolvedValue(
        createMockSession({
          accessToken: 'mock-token',
          refreshToken: 'test-refresh',
          expiresAt: Date.now() + 3600000,
          username: 'testuser',
          userId: 't2_testuser'
        })
      )

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
        })
      )

      await expect(fetchPosts('nonexistent', 'hot')).rejects.toThrow(
        'Subreddit not found'
      )
    })

    it('handles 429 rate limit', async () => {
      server.use(
        http.get('https://oauth.reddit.com/r/:subreddit/:sort.json', () => {
          return new HttpResponse(null, {status: 429})
        })
      )

      await expect(fetchPosts('popular', 'hot')).rejects.toThrow(
        'Rate limit exceeded. Log in to continue viewing the site.'
      )
    })

    it('includes time filter parameter for top sort', async () => {
      mockGetSession.mockResolvedValue(
        createMockSession({
          accessToken: 'mock-token'
        })
      )

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
      mockGetSession.mockResolvedValue(
        createMockSession({
          accessToken: 'mock-token'
        })
      )

      let requestUrl = ''
      server.use(
        http.get(
          'https://oauth.reddit.com/r/:subreddit/:sort.json',
          ({request}) => {
            requestUrl = request.url
            return HttpResponse.json({
              data: {
                children: [
                  {kind: 't3', data: {id: 'test1', title: 'Controversial Post'}}
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
      mockGetSession.mockResolvedValue(
        createMockSession({
          accessToken: 'mock-token'
        })
      )

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
      mockGetSession.mockResolvedValue(
        createMockSession({
          accessToken: 'mock-token'
        })
      )

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

      // Should not have t= param when timeFilter is undefined
      expect(requestUrl).toContain('popular/top.json')
      // Check that neither "t=" nor "&t=" appears in URL
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
        )
      )

      await expect(fetchPost('AskReddit', 'missing', 'best')).rejects.toThrow(
        'Post not found'
      )
    })
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
        'Subreddit not found'
      )
    })
  })

  describe('fetchUserSubscriptions', () => {
    it('returns empty result when not authenticated', async () => {
      const result = await fetchUserSubscriptions()

      expect(result).toEqual([])
    })

    it('fetches subscriptions when authenticated', async () => {
      mockGetSession.mockResolvedValue(
        createMockSession({
          accessToken: 'mock-token',
          refreshToken: 'test-refresh',
          expiresAt: Date.now() + 3600000,
          username: 'testuser',
          userId: 't2_testuser'
        })
      )

      // MSW handler not configured for this endpoint, returns empty
      const result = await fetchUserSubscriptions()

      expect(Array.isArray(result)).toBe(true)
    })

    it('returns empty result on error', async () => {
      mockGetSession.mockResolvedValue(
        createMockSession({
          accessToken: 'mock-token',
          username: 'testuser'
        })
      )

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
      mockGetSession.mockResolvedValue(
        createMockSession({
          accessToken: 'mock-token',
          username: 'testuser'
        })
      )

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

      // Should fetch all pages and return combined results
      expect(Array.isArray(result)).toBe(true)
      expect(result).toHaveLength(2)
      expect(result[0].name).toBe('programming')
      expect(result[1].name).toBe('javascript')
    })
  })

  describe('votePost', () => {
    it('returns error when not authenticated', async () => {
      const result = await votePost('t3_test123', 1)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Not authenticated')
    })

    it('votes successfully when authenticated', async () => {
      mockGetSession.mockResolvedValue(
        createMockSession({
          accessToken: 'mock-token',
          username: 'testuser'
        })
      )

      const result = await votePost('t3_test123', 1)

      expect(result.success).toBe(true)
    })

    it('handles 401 errors', async () => {
      mockGetSession.mockResolvedValue(
        createMockSession({
          accessToken: 'expired-token',
          username: 'testuser'
        })
      )

      server.use(
        http.post('https://oauth.reddit.com/api/vote', () => {
          return new HttpResponse(null, {status: 401})
        })
      )

      const result = await votePost('t3_test123', 1)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Session expired')
    })
  })

  describe('savePost', () => {
    it('returns error when not authenticated', async () => {
      const result = await savePost('t3_test123', true)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Not authenticated')
    })

    it('saves post when authenticated', async () => {
      mockGetSession.mockResolvedValue(
        createMockSession({
          accessToken: 'mock-token',
          username: 'testuser'
        })
      )

      const result = await savePost('t3_test123', true)

      expect(result.success).toBe(true)
    })

    it('unsaves post when authenticated', async () => {
      mockGetSession.mockResolvedValue(
        createMockSession({
          accessToken: 'mock-token',
          username: 'testuser'
        })
      )

      const result = await savePost('t3_test123', false)

      expect(result.success).toBe(true)
    })
  })

  describe('fetchMultireddits', () => {
    it('returns empty array when not authenticated', async () => {
      const multis = await fetchMultireddits()

      expect(multis).toEqual([])
    })

    it('fetches multireddits when authenticated', async () => {
      mockGetSession.mockResolvedValue(
        createMockSession({
          accessToken: 'mock-token',
          refreshToken: 'test-refresh',
          expiresAt: Date.now() + 3600000,
          username: 'testuser',
          userId: 't2_testuser'
        })
      )

      // MSW handler not configured for this endpoint, returns empty
      const multis = await fetchMultireddits()

      expect(Array.isArray(multis)).toBe(true)
    })
  })

  describe('fetchUserInfo', () => {
    it('fetches user profile', async () => {
      mockGetSession.mockResolvedValue(
        createMockSession({
          accessToken: 'mock-token'
        })
      )

      server.use(
        http.get('https://oauth.reddit.com/user/:username/about.json', () => {
          return HttpResponse.json({
            data: {
              name: 'testuser',
              total_karma: 1234,
              created_utc: 1234567890,
              icon_img: 'https://example.com/avatar.png'
            }
          })
        })
      )

      const user = await fetchUserInfo('testuser')

      expect(user.name).toBe('testuser')
      expect(user.total_karma).toBeDefined()
    })

    it('handles 404 errors', async () => {
      server.use(
        http.get('https://oauth.reddit.com/user/:username/about.json', () => {
          return new HttpResponse(null, {status: 404})
        })
      )

      await expect(fetchUserInfo('nonexistent')).rejects.toThrow(
        'User not found'
      )
    })
  })

  describe('fetchUserPosts', () => {
    it('fetches user submitted posts', async () => {
      server.use(
        http.get(
          'https://oauth.reddit.com/user/:username/submitted.json',
          () => {
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
        'User not found'
      )
    })
  })

  describe('searchReddit', () => {
    it('searches reddit for posts', async () => {
      mockGetSession.mockResolvedValue(
        createMockSession({
          accessToken: 'mock-token'
        })
      )

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

      await expect(searchReddit('test')).rejects.toThrow('Reddit API error')
    })
  })

  describe('searchSubreddits', () => {
    it('returns empty array for short queries', async () => {
      const result = await searchSubreddits('a')

      expect(result.success).toBe(true)
      expect(result.data).toEqual([])
    })

    it('searches for subreddits', async () => {
      mockGetSession.mockResolvedValue(
        createMockSession({
          accessToken: 'mock-token'
        })
      )

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
      expect(result.error).toBeDefined()
    })
  })

  describe('toggleSubscription', () => {
    it('requires authentication', async () => {
      const result = await toggleSubscription('programming', 'sub')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Authentication required')
    })

    it('subscribes to subreddit when authenticated', async () => {
      mockGetSession.mockResolvedValue(
        createMockSession({
          accessToken: 'mock-token',
          refreshToken: 'test-refresh',
          expiresAt: Date.now() + 3600000,
          username: 'testuser',
          userId: 't2_testuser'
        })
      )

      const result = await toggleSubscription('programming', 'sub')

      expect(result.success).toBe(true)
    })

    it('handles 429 rate limit', async () => {
      mockGetSession.mockResolvedValue(
        createMockSession({
          accessToken: 'mock-token',
          username: 'testuser'
        })
      )

      server.use(
        http.post('https://oauth.reddit.com/api/subscribe', () => {
          return new HttpResponse(null, {status: 429})
        })
      )

      const result = await toggleSubscription('programming', 'sub')

      expect(result.success).toBe(false)
      expect(result.error).toContain(
        'Rate limit exceeded. Log in to continue viewing the site.'
      )
    })
  })

  describe('fetchSavedPosts', () => {
    it('requires authentication', async () => {
      await expect(fetchSavedPosts('testuser')).rejects.toThrow(
        'Authentication required'
      )
    })

    it('fetches saved posts when authenticated', async () => {
      mockGetSession.mockResolvedValue(
        createMockSession({
          accessToken: 'mock-token',
          username: 'testuser'
        })
      )

      server.use(
        http.get('https://oauth.reddit.com/user/:username/saved.json', () => {
          return HttpResponse.json({
            data: {
              children: [
                {
                  kind: 't3',
                  data: {
                    id: 'saved1',
                    title: 'Saved Post',
                    stickied: false
                  }
                }
              ],
              after: 't3_after'
            }
          })
        })
      )

      const {posts, after} = await fetchSavedPosts('testuser')

      expect(posts.length).toBeGreaterThan(0)
      expect(after).toBeDefined()
    })

    it('handles 404 errors', async () => {
      mockGetSession.mockResolvedValue(
        createMockSession({
          accessToken: 'mock-token',
          username: 'testuser'
        })
      )

      server.use(
        http.get('https://oauth.reddit.com/user/:username/saved.json', () => {
          return new HttpResponse(null, {status: 404})
        })
      )

      await expect(fetchSavedPosts('nonexistent')).rejects.toThrow(
        'User not found'
      )
    })
  })
})
