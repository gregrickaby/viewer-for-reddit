import {http, HttpResponse} from 'msw'

/**
 * MSW handlers for logging API endpoints.
 *
 * Handles:
 * - POST /api/axiom - Axiom proxy client-side logging endpoint
 */
export const logHandlers = [
  // Axiom proxy endpoint - just acknowledge and ignore
  http.post('/api/axiom', () => {
    return HttpResponse.json({success: true})
  })
]
