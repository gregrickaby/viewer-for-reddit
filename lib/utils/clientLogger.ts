/**
 * Client-side logger that sends logs to the server API endpoint
 */

interface ClientLogContext {
  component?: string
  action?: string
  [key: string]: unknown
}

/**
 * Send log data to server-side logging endpoint
 */
async function sendLogToServer(
  level: string,
  message: string,
  context?: ClientLogContext
): Promise<void> {
  try {
    await fetch('/api/log', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        level,
        message,
        context: {
          ...context,
          clientTimestamp: new Date().toISOString()
        }
      })
    })
  } catch (error) {
    // Fallback to console if API call fails
    console.error('Failed to send log to server:', error)
    console.error('Original log:', {level, message, context})
  }
}

/**
 * Client-side error logger that sends to server
 */
export function logClientError(
  message: string,
  context?: ClientLogContext
): void {
  sendLogToServer('error', message, context)
}

/**
 * Client-side info logger that sends to server
 */
export function logClientInfo(
  message: string,
  context?: ClientLogContext
): void {
  sendLogToServer('info', message, context)
}
