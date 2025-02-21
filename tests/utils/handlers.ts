import { http, HttpResponse } from 'msw'
import { mockSubredditResponse } from '../mocks/mockSubredditResponse'

/**
 * Intercept requests and respond with a JSON response.
 */
export const handlers = [
  // Successful response to a subreddit request.
  http.get('https://www.reddit.com/r/:subreddit/hot.json', () => {
    return HttpResponse.json(mockSubredditResponse)
  })
]
