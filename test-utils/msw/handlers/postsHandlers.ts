import {http, HttpResponse} from 'msw'
import {subredditMock} from '../../mocks/subreddit'

export const postsHandlers = [
  // Fetch posts from OAuth endpoint (authenticated users)
  http.get('https://oauth.reddit.com/r/:subreddit/:sort.json', ({params}) => {
    const {subreddit} = params

    // Handle specific test cases
    if (subreddit === 'empty') {
      return HttpResponse.json({
        data: {
          children: [],
          after: null
        }
      })
    }

    if (subreddit === 'noafter') {
      return HttpResponse.json({
        data: {
          children: [
            {
              data: {
                id: 'post1',
                title: 'Test Post',
                author: 'testuser',
                score: 100
              }
            }
          ],
          after: null
        }
      })
    }

    // Default success response
    return HttpResponse.json(subredditMock)
  }),

  // Fetch posts from public endpoint (anonymous users)
  http.get('https://www.reddit.com/r/:subreddit/:sort.json', ({params}) => {
    const {subreddit} = params

    // Handle specific test cases
    if (subreddit === 'empty') {
      return HttpResponse.json({
        data: {
          children: [],
          after: null
        }
      })
    }

    if (subreddit === 'noafter') {
      return HttpResponse.json({
        data: {
          children: [
            {
              data: {
                id: 'post1',
                title: 'Test Post',
                author: 'testuser',
                score: 100
              }
            }
          ],
          after: null
        }
      })
    }

    // Default success response
    return HttpResponse.json(subredditMock)
  }),

  // Home feed (authenticated only, OAuth endpoint)
  http.get('https://oauth.reddit.com/:sort.json', () => {
    return HttpResponse.json(subredditMock)
  }),

  // Multireddit feed (OAuth endpoint)
  http.get(
    'https://oauth.reddit.com/user/:username/m/:multiname/:sort.json',
    () => {
      return HttpResponse.json(subredditMock)
    }
  )
]
