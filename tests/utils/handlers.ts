import { http, HttpResponse } from 'msw'

/**
 * Intercept requests and respond with a JSON response.
 */
export const handlers = [
  http.get('https://reddit.com/r/:subreddit.json', () => {
    return HttpResponse.json({
      data: {
        children: []
      }
    })
  })
]
