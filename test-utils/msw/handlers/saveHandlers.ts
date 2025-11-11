import {http, HttpResponse} from 'msw'

/**
 * MSW handlers for save-related API endpoints.
 *
 * Handles:
 * - POST /api/reddit/save - Save/unsave posts
 */
export const saveHandlers = [
  // App API route handler - save/unsave post
  http.post('http://localhost:3000/api/reddit/save', async ({request}) => {
    const body = (await request.json()) as {
      id: string
      save: boolean
    }

    return HttpResponse.json({
      success: true,
      id: body.id,
      saved: body.save
    })
  }),

  // Reddit OAuth API handler - save endpoint
  http.post('https://oauth.reddit.com/api/save', () => {
    return HttpResponse.json({})
  }),

  // Reddit OAuth API handler - unsave endpoint
  http.post('https://oauth.reddit.com/api/unsave', () => {
    return HttpResponse.json({})
  })
]
