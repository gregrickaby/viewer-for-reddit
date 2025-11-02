import {http, HttpResponse} from 'msw'

/**
 * MSW handlers for logging API endpoints.
 *
 * Handles:
 * - POST /api/log - Client-side error logging
 */
export const logHandlers = [
  // Client-side logging endpoint - just acknowledge and ignore
  http.post('/api/log', () => {
    return HttpResponse.json({success: true})
  })
]
