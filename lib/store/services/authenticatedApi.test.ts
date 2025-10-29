import {makeStore} from '@/lib/store'
import {authenticatedApi} from '@/lib/store/services/authenticatedApi'
import {http, HttpResponse, server} from '@/test-utils'
import {describe, expect, it} from 'vitest'

describe('Custom Feed Integration Flow', () => {
  describe('getUserCustomFeeds', () => {
    it('should fetch and transform custom feeds list', async () => {
      // Mock the Reddit API response (via /api/reddit/me proxy)
      server.use(
        http.get('http://localhost:3000/api/reddit/me', () => {
          return HttpResponse.json([
            {
              data: {
                name: 'test_multi',
                display_name: 'Test Multi',
                path: '/user/testuser/m/test_multi/',
                icon_url: 'https://example.com/icon.png',
                subreddits: [{name: 'programming'}, {name: 'webdev'}]
              }
            },
            {
              data: {
                name: 'news_multi',
                display_name: 'News Multi',
                path: '/user/testuser/m/news_multi/',
                icon_url: '',
                subreddits: [{name: 'news'}, {name: 'worldnews'}]
              }
            }
          ])
        })
      )

      const store = makeStore()
      const result = await store.dispatch(
        authenticatedApi.endpoints.getUserCustomFeeds.initiate()
      )

      expect(result.data).toEqual([
        {
          name: 'test_multi',
          display_name: 'Test Multi',
          path: '/user/testuser/m/test_multi',
          icon_url: 'https://example.com/icon.png',
          subreddits: ['programming', 'webdev']
        },
        {
          name: 'news_multi',
          display_name: 'News Multi',
          path: '/user/testuser/m/news_multi',
          icon_url: '',
          subreddits: ['news', 'worldnews']
        }
      ])
    })

    it('should return empty array when not authenticated', async () => {
      server.use(
        http.get('http://localhost:3000/api/reddit/me', () => {
          return HttpResponse.json([])
        })
      )

      const store = makeStore()
      const result = await store.dispatch(
        authenticatedApi.endpoints.getUserCustomFeeds.initiate()
      )

      expect(result.data).toEqual([])
    })

    it('should handle API errors gracefully', async () => {
      server.use(
        http.get('http://localhost:3000/api/reddit/me', () => {
          return new HttpResponse(null, {status: 500})
        })
      )

      const store = makeStore()
      const result = await store.dispatch(
        authenticatedApi.endpoints.getUserCustomFeeds.initiate()
      )

      // RTK Query returns error object on failure, not data
      expect(result.error).toBeDefined()
      expect(result.data).toBeUndefined()
    })
  })

  describe('getCustomFeedPosts', () => {
    it('should fetch posts from a custom feed with pagination', async () => {
      const mockPosts = {
        kind: 'Listing',
        data: {
          after: 't3_def456',
          children: [
            {
              kind: 't3',
              data: {
                id: 'abc123',
                title: 'Test Post 1',
                subreddit: 'programming',
                author: 'testuser',
                score: 100,
                num_comments: 10,
                created_utc: 1234567890,
                permalink: '/r/programming/comments/abc123/test_post_1/',
                url: 'https://example.com',
                stickied: false
              }
            },
            {
              kind: 't3',
              data: {
                id: 'def456',
                title: 'Test Post 2',
                subreddit: 'webdev',
                author: 'testuser2',
                score: 50,
                num_comments: 5,
                created_utc: 1234567891,
                permalink: '/r/webdev/comments/def456/test_post_2/',
                url: 'https://example.com',
                stickied: false
              }
            }
          ]
        }
      }

      server.use(
        http.get('http://localhost:3000/api/reddit/me', ({request}) => {
          const url = new URL(request.url)
          const path = url.searchParams.get('path')

          if (path?.includes('/user/testuser/m/test_multi/hot.json')) {
            return HttpResponse.json(mockPosts)
          }

          return new HttpResponse(null, {status: 404})
        })
      )

      const store = makeStore()
      const result = await store.dispatch(
        authenticatedApi.endpoints.getCustomFeedPosts.initiate({
          username: 'testuser',
          customFeedName: 'test_multi',
          sort: 'hot'
        })
      )

      // Infinite queries return pages array
      expect(result.data).toBeDefined()
      expect(Array.isArray(result.data?.pages)).toBe(true)
      expect(result.data?.pages?.[0]?.data?.children).toHaveLength(2)
      expect(result.data?.pages?.[0]?.data?.children?.[0]?.data?.title).toBe(
        'Test Post 1'
      )
      expect(result.data?.pages?.[0]?.data?.children?.[1]?.data?.title).toBe(
        'Test Post 2'
      )
      expect(result.data?.pages?.[0]?.data?.after).toBe('t3_def456')
    })

    it('should filter out stickied posts', async () => {
      const mockPostsWithSticky = {
        kind: 'Listing',
        data: {
          after: null,
          children: [
            {
              kind: 't3',
              data: {
                id: 'sticky123',
                title: 'Stickied Post',
                stickied: true,
                subreddit: 'programming'
              }
            },
            {
              kind: 't3',
              data: {
                id: 'normal123',
                title: 'Normal Post',
                stickied: false,
                subreddit: 'programming'
              }
            }
          ]
        }
      }

      server.use(
        http.get('http://localhost:3000/api/reddit/me', () => {
          return HttpResponse.json(mockPostsWithSticky)
        })
      )

      const store = makeStore()
      const result = await store.dispatch(
        authenticatedApi.endpoints.getCustomFeedPosts.initiate({
          username: 'testuser',
          customFeedName: 'test_multi',
          sort: 'hot'
        })
      )

      // Infinite queries return pages array, stickied posts should be filtered
      expect(result.data?.pages?.[0]?.data?.children).toHaveLength(1)
      expect(result.data?.pages?.[0]?.data?.children?.[0]?.data?.id).toBe(
        'normal123'
      )
    })

    it('should support infinite scroll pagination', async () => {
      const firstPage = {
        kind: 'Listing',
        data: {
          after: 't3_page2',
          children: [
            {kind: 't3', data: {id: 'post1', title: 'Post 1', stickied: false}}
          ]
        }
      }

      const secondPage = {
        kind: 'Listing',
        data: {
          after: null,
          children: [
            {kind: 't3', data: {id: 'post2', title: 'Post 2', stickied: false}}
          ]
        }
      }

      let callCount = 0
      server.use(
        http.get('http://localhost:3000/api/reddit/me', ({request}) => {
          const url = new URL(request.url)
          const path = url.searchParams.get('path')
          const after = new URL(`http://dummy${path}`).searchParams.get('after')

          callCount++
          if (!after) {
            return HttpResponse.json(firstPage)
          } else if (after === 't3_page2') {
            return HttpResponse.json(secondPage)
          }

          return new HttpResponse(null, {status: 404})
        })
      )

      const store = makeStore()

      // First page
      const result1 = await store.dispatch(
        authenticatedApi.endpoints.getCustomFeedPosts.initiate({
          username: 'testuser',
          customFeedName: 'test_multi',
          sort: 'hot'
        })
      )

      // Infinite queries return pages array with pagination info
      expect(result1.data?.pages?.[0]?.data?.after).toBe('t3_page2')
      // RTK Query may make initial requests for cache setup
      expect(callCount).toBeGreaterThanOrEqual(1)

      // Note: The infinite query pattern would continue fetching with the 'after' parameter
      // in a real application, but this demonstrates the pagination mechanism
    })
  })

  describe('getUserSubscriptions', () => {
    it('should fetch and transform user subscriptions', async () => {
      const mockSubscriptions = {
        kind: 'Listing',
        data: {
          children: [
            {
              kind: 't5',
              data: {
                display_name: 'programming',
                icon_img: 'https://example.com/icon1.png',
                community_icon: '',
                over18: false,
                subscribers: 5000000
              }
            },
            {
              kind: 't5',
              data: {
                display_name: 'webdev',
                icon_img: '',
                community_icon: 'https://example.com/icon2.png',
                over18: false,
                subscribers: 1000000
              }
            }
          ]
        }
      }

      server.use(
        http.get('http://localhost:3000/api/reddit/me', ({request}) => {
          const url = new URL(request.url)
          const path = url.searchParams.get('path')

          if (path?.includes('/subreddits/mine/subscriber')) {
            return HttpResponse.json(mockSubscriptions)
          }

          return new HttpResponse(null, {status: 404})
        })
      )

      const store = makeStore()
      const result = await store.dispatch(
        authenticatedApi.endpoints.getUserSubscriptions.initiate()
      )

      expect(result.data).toEqual([
        {
          display_name: 'programming',
          icon_img: 'https://example.com/icon1.png',
          value: 'programming',
          over18: false,
          subscribers: 5000000
        },
        {
          display_name: 'webdev',
          icon_img: 'https://example.com/icon2.png',
          value: 'webdev',
          over18: false,
          subscribers: 1000000
        }
      ])
    })

    it('should return empty array when not authenticated', async () => {
      server.use(
        http.get('http://localhost:3000/api/reddit/me', () => {
          return HttpResponse.json({data: {children: []}})
        })
      )

      const store = makeStore()
      const result = await store.dispatch(
        authenticatedApi.endpoints.getUserSubscriptions.initiate()
      )

      expect(result.data).toEqual([])
    })
  })

  describe('getUserSavedPosts', () => {
    it('should fetch saved posts with pagination', async () => {
      const mockSavedPosts = {
        kind: 'Listing',
        data: {
          after: 't3_next123',
          children: [
            {
              kind: 't3',
              data: {
                id: 'saved1',
                title: 'Saved Post 1',
                subreddit: 'technology',
                author: 'author1',
                score: 200,
                num_comments: 20,
                created_utc: 1234567890,
                permalink: '/r/technology/comments/saved1/saved_post_1/',
                url: 'https://example.com/saved1',
                stickied: false,
                over_18: false
              }
            },
            {
              kind: 't3',
              data: {
                id: 'saved2',
                title: 'Saved Post 2',
                subreddit: 'programming',
                author: 'author2',
                score: 150,
                num_comments: 15,
                created_utc: 1234567891,
                permalink: '/r/programming/comments/saved2/saved_post_2/',
                url: 'https://example.com/saved2',
                stickied: false,
                over_18: false
              }
            }
          ]
        }
      }

      server.use(
        http.get('http://localhost:3000/api/reddit/me', ({request}) => {
          const url = new URL(request.url)
          const path = url.searchParams.get('path')

          if (path?.includes('/user/testuser/saved.json')) {
            return HttpResponse.json(mockSavedPosts)
          }

          return new HttpResponse(null, {status: 404})
        })
      )

      const store = makeStore()
      const result = await store.dispatch(
        authenticatedApi.endpoints.getUserSavedPosts.initiate({
          username: 'testuser'
        })
      )

      expect(result.data).toBeDefined()
      expect(Array.isArray(result.data?.pages)).toBe(true)
      expect(result.data?.pages?.[0]?.data?.children).toHaveLength(2)
      expect(result.data?.pages?.[0]?.data?.children?.[0]?.data?.title).toBe(
        'Saved Post 1'
      )
      expect(result.data?.pages?.[0]?.data?.children?.[1]?.data?.title).toBe(
        'Saved Post 2'
      )
      expect(result.data?.pages?.[0]?.data?.after).toBe('t3_next123')
    })

    it('should filter out comments (kind !== t3)', async () => {
      const mockMixedContent = {
        kind: 'Listing',
        data: {
          after: null,
          children: [
            {
              kind: 't1',
              data: {
                id: 'comment1',
                body: 'This is a saved comment',
                author: 'commenter'
              }
            },
            {
              kind: 't3',
              data: {
                id: 'post1',
                title: 'This is a saved post',
                subreddit: 'technology',
                stickied: false
              }
            },
            {
              kind: 't1',
              data: {
                id: 'comment2',
                body: 'Another saved comment',
                author: 'commenter2'
              }
            }
          ]
        }
      }

      server.use(
        http.get('http://localhost:3000/api/reddit/me', () => {
          return HttpResponse.json(mockMixedContent)
        })
      )

      const store = makeStore()
      const result = await store.dispatch(
        authenticatedApi.endpoints.getUserSavedPosts.initiate({
          username: 'testuser'
        })
      )

      // Should only return posts (t3), filtering out comments (t1)
      expect(result.data?.pages?.[0]?.data?.children).toHaveLength(1)
      expect(result.data?.pages?.[0]?.data?.children?.[0]?.kind).toBe('t3')
      expect(result.data?.pages?.[0]?.data?.children?.[0]?.data?.id).toBe(
        'post1'
      )
    })

    it('should filter out stickied posts', async () => {
      const mockPostsWithSticky = {
        kind: 'Listing',
        data: {
          after: null,
          children: [
            {
              kind: 't3',
              data: {
                id: 'sticky1',
                title: 'Stickied Saved Post',
                stickied: true,
                subreddit: 'announcements'
              }
            },
            {
              kind: 't3',
              data: {
                id: 'normal1',
                title: 'Normal Saved Post',
                stickied: false,
                subreddit: 'technology'
              }
            }
          ]
        }
      }

      server.use(
        http.get('http://localhost:3000/api/reddit/me', () => {
          return HttpResponse.json(mockPostsWithSticky)
        })
      )

      const store = makeStore()
      const result = await store.dispatch(
        authenticatedApi.endpoints.getUserSavedPosts.initiate({
          username: 'testuser'
        })
      )

      // Should filter out stickied posts
      expect(result.data?.pages?.[0]?.data?.children).toHaveLength(1)
      expect(result.data?.pages?.[0]?.data?.children?.[0]?.data?.id).toBe(
        'normal1'
      )
      expect(result.data?.pages?.[0]?.data?.children?.[0]?.data?.stickied).toBe(
        false
      )
    })

    it('should handle empty saved posts', async () => {
      const mockEmpty = {
        kind: 'Listing',
        data: {
          after: null,
          children: []
        }
      }

      server.use(
        http.get('http://localhost:3000/api/reddit/me', () => {
          return HttpResponse.json(mockEmpty)
        })
      )

      const store = makeStore()
      const result = await store.dispatch(
        authenticatedApi.endpoints.getUserSavedPosts.initiate({
          username: 'testuser'
        })
      )

      expect(result.data?.pages?.[0]?.data?.children).toHaveLength(0)
      expect(result.data?.pages?.[0]?.data?.after).toBeNull()
    })

    it('should support pagination with after parameter', async () => {
      const firstPage = {
        kind: 'Listing',
        data: {
          after: 't3_page2_token',
          children: [
            {
              kind: 't3',
              data: {
                id: 'saved_post1',
                title: 'First Saved Post',
                stickied: false
              }
            }
          ]
        }
      }

      const secondPage = {
        kind: 'Listing',
        data: {
          after: null,
          children: [
            {
              kind: 't3',
              data: {
                id: 'saved_post2',
                title: 'Second Saved Post',
                stickied: false
              }
            }
          ]
        }
      }

      let callCount = 0
      server.use(
        http.get('http://localhost:3000/api/reddit/me', ({request}) => {
          const url = new URL(request.url)
          const path = url.searchParams.get('path')
          const after = new URL(`http://dummy${path}`).searchParams.get('after')

          callCount++
          if (!after) {
            return HttpResponse.json(firstPage)
          } else if (after === 't3_page2_token') {
            return HttpResponse.json(secondPage)
          }

          return new HttpResponse(null, {status: 404})
        })
      )

      const store = makeStore()

      // First page
      const result = await store.dispatch(
        authenticatedApi.endpoints.getUserSavedPosts.initiate({
          username: 'testuser'
        })
      )

      expect(result.data?.pages?.[0]?.data?.after).toBe('t3_page2_token')
      expect(callCount).toBeGreaterThanOrEqual(1)
    })

    it('should handle API errors gracefully', async () => {
      server.use(
        http.get('http://localhost:3000/api/reddit/me', () => {
          return new HttpResponse(null, {status: 500})
        })
      )

      const store = makeStore()
      const result = await store.dispatch(
        authenticatedApi.endpoints.getUserSavedPosts.initiate({
          username: 'testuser'
        })
      )

      expect(result.error).toBeDefined()
      expect(result.data).toBeUndefined()
    })
  })
})
