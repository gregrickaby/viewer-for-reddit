import {http, HttpResponse} from 'msw'
import {tokenMock} from '../../mocks/token'

export const authHandlers = [
  // Token endpoint
  http.post('https://www.reddit.com/api/v1/access_token', async () => {
    return HttpResponse.json(tokenMock)
  }),

  // OAuth user info endpoint
  http.get('https://oauth.reddit.com/api/v1/me', async ({request}) => {
    const authHeader = request.headers.get('Authorization')

    if (!authHeader?.startsWith('Bearer ')) {
      return HttpResponse.json(
        {error: 'unauthorized', message: 'No valid access token'},
        {status: 401}
      )
    }

    return HttpResponse.json({
      name: 'testuser',
      id: 'test123',
      icon_img: 'https://example.com/avatar.png',
      created_utc: 1234567890
    })
  }),

  // Custom feeds endpoint
  http.get(
    'https://oauth.reddit.com/api/multi/mine.json',
    async ({request}) => {
      const authHeader = request.headers.get('Authorization')

      if (!authHeader?.startsWith('Bearer ')) {
        return HttpResponse.json(
          {error: 'unauthorized', message: 'No valid access token'},
          {status: 401}
        )
      }

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
    }
  ),

  // Saved posts endpoint
  http.get(
    'https://oauth.reddit.com/user/:username/saved.json',
    async ({params, request}) => {
      const {username} = params
      const authHeader = request.headers.get('Authorization')
      const url = new URL(request.url)
      const after = url.searchParams.get('after')

      if (!authHeader?.startsWith('Bearer ')) {
        return HttpResponse.json(
          {error: 'unauthorized', message: 'No valid access token'},
          {status: 401}
        )
      }

      // Handle different test scenarios
      if (username === 'emptyuser') {
        return HttpResponse.json({
          kind: 'Listing',
          data: {
            after: null,
            children: []
          }
        })
      }

      // Handle pagination
      if (after === 'no-more-posts') {
        return HttpResponse.json({
          kind: 'Listing',
          data: {
            after: null,
            children: []
          }
        })
      }

      // Return mock saved posts with mixed content (posts and comments)
      return HttpResponse.json({
        kind: 'Listing',
        data: {
          after: after ? null : 't3_next123',
          children: [
            {
              kind: 't1',
              data: {
                id: 'comment1',
                body: 'This is a saved comment',
                author: 'testuser',
                subreddit: 'technology'
              }
            },
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
            },
            {
              kind: 't1',
              data: {
                id: 'comment2',
                body: 'Another saved comment',
                author: 'testuser',
                subreddit: 'programming'
              }
            }
          ]
        }
      })
    }
  ),

  // Authenticated Reddit API proxy (/api/reddit/me)
  http.get('http://localhost:3000/api/reddit/me', async ({request}) => {
    const url = new URL(request.url)
    const path = url.searchParams.get('path')

    if (!path) {
      return new HttpResponse(null, {status: 400})
    }

    // Handle saved posts
    if (path?.includes('/saved.json')) {
      const username = path.split('/')[2]
      const pathUrl = new URL(`http://example.com${path}`)
      const after = pathUrl.searchParams.get('after')

      if (username === 'emptyuser') {
        return HttpResponse.json({
          kind: 'Listing',
          data: {
            after: null,
            children: []
          }
        })
      }

      if (after === 'no-more-posts') {
        return HttpResponse.json({
          kind: 'Listing',
          data: {
            after: null,
            children: []
          }
        })
      }

      return HttpResponse.json({
        kind: 'Listing',
        data: {
          after: after ? null : 't3_next123',
          children: [
            {
              kind: 't1',
              data: {
                id: 'comment1',
                body: 'This is a saved comment',
                author: 'testuser',
                subreddit: 'technology'
              }
            },
            {
              kind: 't3',
              data: {
                id: 'saved1',
                title: 'Saved Post 1',
                subreddit: 'technology',
                author: 'author1',
                score: 100,
                num_comments: 10,
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
            },
            {
              kind: 't1',
              data: {
                id: 'comment2',
                body: 'Another saved comment',
                author: 'testuser',
                subreddit: 'programming'
              }
            }
          ]
        }
      })
    }

    // Handle custom feeds
    if (path === '/api/multi/mine.json') {
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
    }

    return new HttpResponse(null, {status: 404})
  })
]
