import { http, HttpResponse } from 'msw'
import { mockPopularResponse } from './mockPopularResponse'
import { mockSubredditResponse } from './mockSubredditResponse'

/**
 * Intercept requests and respond with a JSON response.
 */
export const handlers = [
  // Successful response to a subreddit request.
  http.get('https://www.reddit.com/r/aww/hot.json', () => {
    return HttpResponse.json(mockSubredditResponse)
  }),

  // Successful response to popular subreddits request.
  http.get('https://www.reddit.com/subreddits/popular.json', ({ request }) => {
    const url = new URL(request.url)
    const after = url.searchParams.get('after')

    if (!after) {
      return HttpResponse.json(mockPopularResponse)
    } else {
      // For pagination testing.
      const secondPage = {
        ...mockPopularResponse,
        data: {
          ...mockPopularResponse.data,
          after: null,
          children: [
            {
              kind: 't5',
              data: {
                id: 'secondpage_sub',
                display_name: 'gaming',
                subscribers: 30000000,
                icon_img: 'https://example.com/icon3.png',
                url: '/r/gaming/'
              }
            }
          ]
        }
      }
      return HttpResponse.json(secondPage)
    }
  })
]
