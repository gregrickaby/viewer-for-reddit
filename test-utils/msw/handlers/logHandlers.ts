import {http, HttpResponse} from 'msw'

/**
 * MSW handlers for logging API endpoints.
 *
 * Handles:
 * - POST to the Datadog Logs Intake API used by lib/datadog/server.ts
 */
export const logHandlers = [
  http.post('https://http-intake.logs.datadoghq.com/api/v2/logs', () => {
    return HttpResponse.json({success: true})
  })
]
