/**
 * Client-side logger that sends logs to the server API endpoint
 */

interface ClientLogContext {
  component?: string
  action?: string
  [key: string]: unknown
}

/**
 * Serialize an error to a string for logging
 */
function serializeError(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  if (typeof error === 'object' && error !== null) {
    return JSON.stringify(error)
  }
  return String(error)
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
 * Client-side error logger that sends to server.
 * Automatically serializes error objects.
 *
 * @param message - Error message
 * @param errorOrContext - Error object or context object
 * @param context - Optional context if error is provided as second parameter
 */
export function logClientError(
  message: string,
  errorOrContext?: unknown,
  context?: ClientLogContext
): void {
  let finalContext: ClientLogContext = {}

  // If third parameter is provided, second parameter is treated as the error
  if (context !== undefined) {
    // Second param is the error, third param is context
    finalContext = {
      ...context,
      errorMessage: serializeError(errorOrContext),
      errorType: typeof errorOrContext
    }
  } else if (errorOrContext !== undefined && errorOrContext !== null) {
    // Only second param provided - need to determine if it's error or context
    // Check if it looks like a ClientLogContext object (has component or action)
    const isContext =
      typeof errorOrContext === 'object' &&
      !Array.isArray(errorOrContext) &&
      ('component' in errorOrContext || 'action' in errorOrContext) &&
      // But not if it also has error-like properties
      !(
        errorOrContext instanceof Error ||
        ('status' in errorOrContext && 'data' in errorOrContext)
      )

    if (isContext) {
      // It's a context object (old API)
      finalContext = errorOrContext as ClientLogContext
    } else {
      // It's an error (could be Error, object, string, number, etc.)
      finalContext = {
        errorMessage: serializeError(errorOrContext),
        errorType: typeof errorOrContext
      }
    }
  }

  sendLogToServer('error', message, finalContext)
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
