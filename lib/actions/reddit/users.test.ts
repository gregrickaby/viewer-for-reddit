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
  fetchFollowedUsers,
  fetchSavedItems,
  fetchUserComments,
  fetchUserInfo,
  followUser,
  getCurrentUserAvatar,
  savePost,
  unfollowUser,
  votePost
} from './users'

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

describe('users server actions', () => {
  beforeEach(() => {
    mockGetRedditContext.mockClear()
    mockGetRedditContext.mockResolvedValue(createAuthContext())
  })

  describe('votePost', () => {
    it('returns error when not authenticated', async () => {
      mockGetRedditContext.mockResolvedValue(createAnonContext())

      const result = await votePost('t3_test123', 1)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Something went wrong. Please try again.')
    })

    it('votes successfully when authenticated', async () => {
      const result = await votePost('t3_test123', 1)

      expect(result.success).toBe(true)
    })

    it('handles 401 errors', async () => {
      server.use(
        http.post('https://oauth.reddit.com/api/vote', () => {
          return new HttpResponse(null, {status: 401})
        })
      )

      const result = await votePost('t3_test123', 1)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Something went wrong. Please try again.')
    })
  })

  describe('savePost', () => {
    it('returns error when not authenticated', async () => {
      mockGetRedditContext.mockResolvedValue(createAnonContext())

      const result = await savePost('t3_test123', true)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Something went wrong. Please try again.')
    })

    it('saves post when authenticated', async () => {
      const result = await savePost('t3_test123', true)

      expect(result.success).toBe(true)
    })

    it('unsaves post when authenticated', async () => {
      const result = await savePost('t3_test123', false)

      expect(result.success).toBe(true)
    })
  })

  describe('fetchUserInfo', () => {
    it('fetches user profile', async () => {
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
        'Resource not found'
      )
    })
  })

  describe('fetchSavedItems', () => {
    it('requires authentication', async () => {
      mockGetRedditContext.mockResolvedValue(createAnonContext())

      await expect(fetchSavedItems('testuser')).rejects.toThrow(
        'Something went wrong.'
      )
    })

    it('fetches saved items (posts and comments) when authenticated', async () => {
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
                },
                {
                  kind: 't1',
                  data: {
                    id: 'comment1',
                    body: 'Saved Comment',
                    stickied: false,
                    link_title: 'Original Post',
                    subreddit: 'testsubreddit'
                  }
                }
              ],
              after: 't3_after'
            }
          })
        })
      )

      const {items, after} = await fetchSavedItems('testuser')

      expect(items.length).toBe(2)
      expect(items[0].type).toBe('post')
      expect(items[1].type).toBe('comment')
      expect(after).toBe('t3_after')
    })

    it('filters out stickied posts and comments', async () => {
      server.use(
        http.get('https://oauth.reddit.com/user/:username/saved.json', () => {
          return HttpResponse.json({
            data: {
              children: [
                {
                  kind: 't3',
                  data: {
                    id: 'saved1',
                    title: 'Normal Post',
                    stickied: false
                  }
                },
                {
                  kind: 't3',
                  data: {
                    id: 'sticky1',
                    title: 'Sticky Post',
                    stickied: true
                  }
                },
                {
                  kind: 't1',
                  data: {
                    id: 'comment1',
                    body: 'Normal Comment',
                    stickied: false
                  }
                },
                {
                  kind: 't1',
                  data: {
                    id: 'sticky_comment1',
                    body: 'Sticky Comment',
                    stickied: true
                  }
                }
              ],
              after: null
            }
          })
        })
      )

      const {items} = await fetchSavedItems('testuser')

      expect(items.length).toBe(2)
      expect(items[0].data.id).toBe('saved1')
      expect(items[1].data.id).toBe('comment1')
    })

    it('handles 404 errors', async () => {
      server.use(
        http.get('https://oauth.reddit.com/user/:username/saved.json', () => {
          return new HttpResponse(null, {status: 404})
        })
      )

      await expect(fetchSavedItems('nonexistent')).rejects.toThrow(
        'Something went wrong.'
      )
    })

    it('handles pagination with after parameter', async () => {
      server.use(
        http.get('https://oauth.reddit.com/user/:username/saved.json', () => {
          return HttpResponse.json({
            data: {
              children: [
                {
                  kind: 't3',
                  data: {
                    id: 'saved2',
                    title: 'Next Page Post',
                    stickied: false
                  }
                }
              ],
              after: null
            }
          })
        })
      )

      const {items, after} = await fetchSavedItems('testuser', 't3_cursor')

      expect(items.length).toBe(1)
      expect(after).toBeNull()
    })
  })

  describe('fetchFollowedUsers', () => {
    it('fetches followed users for authenticated user', async () => {
      server.use(
        http.get('https://oauth.reddit.com/api/v1/me/friends', () => {
          return HttpResponse.json({
            data: {
              children: [
                {
                  name: 'user1',
                  id: 't2_user1',
                  date: 1609459200,
                  note: 'Great content'
                },
                {
                  name: 'user2',
                  id: 't2_user2',
                  date: 1609545600
                }
              ]
            }
          })
        })
      )

      const following = await fetchFollowedUsers()

      expect(following).toHaveLength(2)
      expect(following[0].name).toBe('user1')
      expect(following[0].id).toBe('t2_user1')
      expect(following[0].date).toBe(1609459200)
      expect(following[0].note).toBe('Great content')
      expect(following[1].name).toBe('user2')
      expect(following[1].note).toBeUndefined()
    })

    it('returns empty array for unauthenticated users', async () => {
      mockGetRedditContext.mockResolvedValue(createAnonContext())

      const following = await fetchFollowedUsers()

      expect(following).toEqual([])
    })

    it('returns empty array when API fails', async () => {
      server.use(
        http.get('https://oauth.reddit.com/api/v1/me/friends', () => {
          return new HttpResponse(null, {status: 500})
        })
      )

      const following = await fetchFollowedUsers()

      expect(following).toEqual([])
    })

    it('handles empty following list', async () => {
      server.use(
        http.get('https://oauth.reddit.com/api/v1/me/friends', () => {
          return HttpResponse.json({
            data: {
              children: []
            }
          })
        })
      )

      const following = await fetchFollowedUsers()

      expect(following).toEqual([])
    })
  })

  describe('followUser', () => {
    it('follows a user when authenticated', async () => {
      mockGetRedditContext.mockResolvedValue(createAuthContext('currentuser'))

      server.use(
        http.put('https://oauth.reddit.com/api/v1/me/friends/testuser', () => {
          return HttpResponse.json({name: 'testuser'})
        })
      )

      const result = await followUser('testuser')

      expect(result.success).toBe(true)
    })

    it('returns failure for unauthenticated users', async () => {
      mockGetRedditContext.mockResolvedValue(createAnonContext())

      const result = await followUser('testuser')

      expect(result.success).toBe(false)
    })

    it('returns failure when API call fails', async () => {
      mockGetRedditContext.mockResolvedValue(createAuthContext('currentuser'))

      server.use(
        http.put('https://oauth.reddit.com/api/v1/me/friends/testuser', () => {
          return new HttpResponse(null, {status: 403})
        })
      )

      const result = await followUser('testuser')

      expect(result.success).toBe(false)
    })

    it('returns failure for invalid username', async () => {
      const result = await followUser('../../invalid')

      expect(result.success).toBe(false)
    })
  })

  describe('unfollowUser', () => {
    it('unfollows a user when authenticated', async () => {
      mockGetRedditContext.mockResolvedValue(createAuthContext('currentuser'))

      server.use(
        http.delete(
          'https://oauth.reddit.com/api/v1/me/friends/testuser',
          () => {
            return new HttpResponse(null, {status: 204})
          }
        )
      )

      const result = await unfollowUser('testuser')

      expect(result.success).toBe(true)
    })

    it('returns failure for unauthenticated users', async () => {
      mockGetRedditContext.mockResolvedValue(createAnonContext())

      const result = await unfollowUser('testuser')

      expect(result.success).toBe(false)
    })

    it('returns failure when API call fails', async () => {
      mockGetRedditContext.mockResolvedValue(createAuthContext('currentuser'))

      server.use(
        http.delete(
          'https://oauth.reddit.com/api/v1/me/friends/testuser',
          () => {
            return new HttpResponse(null, {status: 404})
          }
        )
      )

      const result = await unfollowUser('testuser')

      expect(result.success).toBe(false)
    })

    it('returns failure for invalid username', async () => {
      const result = await unfollowUser('../../invalid')

      expect(result.success).toBe(false)
    })
  })

  describe('getCurrentUserAvatar', () => {
    it('returns null when not authenticated', async () => {
      mockGetRedditContext.mockResolvedValue(createAnonContext())

      const result = await getCurrentUserAvatar()

      expect(result).toBeNull()
    })

    it('returns null when context has no username', async () => {
      mockGetRedditContext.mockResolvedValue({
        ...createAuthContext(),
        username: null
      })

      const result = await getCurrentUserAvatar()

      expect(result).toBeNull()
    })

    it('returns avatar URL when user has icon_img', async () => {
      server.use(
        http.get('https://oauth.reddit.com/user/:username/about.json', () => {
          return HttpResponse.json({
            data: {
              name: 'testuser',
              total_karma: 100,
              created_utc: 1234567890,
              icon_img: 'https://example.com/avatar.png'
            }
          })
        })
      )

      const result = await getCurrentUserAvatar()

      expect(result).toBe('https://example.com/avatar.png')
    })

    it('returns null when user has no icon_img', async () => {
      server.use(
        http.get('https://oauth.reddit.com/user/:username/about.json', () => {
          return HttpResponse.json({
            data: {
              name: 'testuser',
              total_karma: 100,
              created_utc: 1234567890,
              icon_img: ''
            }
          })
        })
      )

      const result = await getCurrentUserAvatar()

      expect(result).toBeNull()
    })

    it('returns null when fetchUserInfo throws', async () => {
      server.use(
        http.get('https://oauth.reddit.com/user/:username/about.json', () => {
          return new HttpResponse(null, {status: 500})
        })
      )

      const result = await getCurrentUserAvatar()

      expect(result).toBeNull()
    })
  })

  describe('fetchUserComments', () => {
    it('fetches user comments with default sort', async () => {
      let requestUrl = ''
      server.use(
        http.get(
          'https://oauth.reddit.com/user/:username/comments.json',
          ({request}) => {
            requestUrl = request.url
            return HttpResponse.json({
              data: {
                children: [
                  {
                    kind: 't1',
                    data: {
                      id: 'comment1',
                      body: 'Test comment',
                      author: 'testuser',
                      score: 10
                    }
                  }
                ],
                after: 't1_next'
              }
            })
          }
        )
      )

      const result = await fetchUserComments('testuser')

      expect(result.comments).toHaveLength(1)
      expect(result.after).toBe('t1_next')
      expect(requestUrl).toContain('sort=new')
    })

    it('supports pagination via after cursor', async () => {
      let requestUrl = ''
      server.use(
        http.get(
          'https://oauth.reddit.com/user/:username/comments.json',
          ({request}) => {
            requestUrl = request.url
            return HttpResponse.json({
              data: {children: [], after: null}
            })
          }
        )
      )

      await fetchUserComments('testuser', 'new', 't1_cursor')

      expect(requestUrl).toContain('after=t1_cursor')
    })

    it('applies time filter for top sort', async () => {
      let requestUrl = ''
      server.use(
        http.get(
          'https://oauth.reddit.com/user/:username/comments.json',
          ({request}) => {
            requestUrl = request.url
            return HttpResponse.json({
              data: {children: [], after: null}
            })
          }
        )
      )

      await fetchUserComments('testuser', 'top', undefined, 'week')

      expect(requestUrl).toContain('t=week')
    })

    it('throws for invalid username', async () => {
      await expect(fetchUserComments('invalid username!')).rejects.toThrow(
        'Something went wrong.'
      )
    })

    it('throws on API error', async () => {
      server.use(
        http.get(
          'https://oauth.reddit.com/user/:username/comments.json',
          () => new HttpResponse(null, {status: 500})
        )
      )

      await expect(fetchUserComments('testuser')).rejects.toThrow(
        'Something went wrong.'
      )
    })
  })
})
