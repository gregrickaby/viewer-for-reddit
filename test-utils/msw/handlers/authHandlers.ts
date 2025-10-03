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

  // Session endpoint
  http.get('/api/auth/session', () => {
    return HttpResponse.json(null)
  }),

  // Logout endpoint
  http.post('/api/auth/logout', () => {
    return HttpResponse.json({success: true})
  })
]
