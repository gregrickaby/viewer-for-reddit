import {logError} from '@/lib/utils/logError'
import {validateOrigin} from '@/lib/utils/validateOrigin'
import {NextRequest, NextResponse} from 'next/server'

/**
 * Client-Side Logging API Endpoint
 *
 * Receives structured log messages from client-side applications and processes them
 * server-side for centralized logging, monitoring, and debugging purposes.
 *
 * @example
 * ```ts
 * // Client-side usage with our logging utilities
 * import { logClientError, logClientInfo } from '@/lib/utils/clientLogger'
 *
 * // Log an error with context
 * try {
 *   const userData = await fetchUserData(userId)
 * } catch (error) {
 *   logClientError('Failed to load user data', {
 *     component: 'UserProfile',
 *     action: 'fetchUserData',
 *     userId: '12345',
 *     error: error.message,
 *     stackTrace: error.stack
 *   })
 * }
 * ```
 *
 * @param request - Next.js request object containing the log payload
 * @returns JSON response indicating success or failure
 */
export async function POST(request: NextRequest) {
  // Validate request origin to prevent external log injection attacks
  if (!validateOrigin(request)) {
    return NextResponse.json({error: 'Forbidden'}, {status: 403})
  }

  try {
    const body = await request.json()

    // Extract the logging data from the client
    const {level, message, context} = body

    // Add server-side request info to the context
    const serverContext = {
      ...context,
      serverTimestamp: new Date().toISOString(),
      clientIp:
        request.headers.get('x-forwarded-for') ||
        request.headers.get('x-real-ip') ||
        'unknown',
      serverUserAgent: request.headers.get('user-agent')
    }

    // Log to server-side console using our structured logger
    if (level === 'error') {
      logError(message, serverContext)
    } else {
      // Could extend to support other log levels if needed
      console.info(
        JSON.stringify(
          {
            timestamp: new Date().toISOString(),
            level,
            message,
            context: serverContext
          },
          null,
          2
        )
      )
    }

    return NextResponse.json({success: true})
  } catch (error) {
    logError(error, {
      component: 'LoggingAPI',
      action: 'POST',
      context: 'Failed to process client-side log'
    })

    return NextResponse.json({error: 'Failed to process log'}, {status: 500})
  }
}
