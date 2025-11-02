import {http, HttpResponse} from 'msw'

/**
 * MSW handlers for subscription-related API endpoints.
 *
 * Handles:
 * - POST /api/reddit/subscribe - Subscribe/unsubscribe to subreddits
 */
export const subscribeHandlers = [
  // App API route handler - subscribe/unsubscribe to subreddit
  http.post('http://localhost:3000/api/reddit/subscribe', async ({request}) => {
    const body = (await request.json()) as {
      action: 'sub' | 'unsub'
      sr_name: string
    }

    return HttpResponse.json({
      success: true,
      action: body.action,
      sr_name: body.sr_name
    })
  }),

  // Reddit OAuth API handler - actual Reddit API endpoint
  http.post('https://oauth.reddit.com/api/subscribe', () => {
    return HttpResponse.json({})
  })
]
