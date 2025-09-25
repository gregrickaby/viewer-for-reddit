import {logError} from '@/lib/utils/logError'
import {NextRequest, NextResponse} from 'next/server'

/**
 * API endpoint to receive client-side logs and log them server-side
 */
export async function POST(request: NextRequest) {
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
