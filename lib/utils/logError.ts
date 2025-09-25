interface LogContext {
  component?: string
  action?: string
  userId?: string
  requestId?: string
  [key: string]: unknown
}

interface StructuredLog {
  timestamp: string
  level: 'error'
  message: string
  error?: {
    name?: string
    message?: string
    stack?: string
    status?: number | string
    data?: unknown
  }
  context?: LogContext
}

/**
 * Log a structured error to the console.
 *
 * @param error Error to log.
 * @param context Additional context information.
 */
export function logError(error: unknown, context?: LogContext): void {
  const log: StructuredLog = {
    timestamp: new Date().toISOString(),
    level: 'error',
    message: '',
    context
  }

  if (error instanceof Error) {
    log.message = error.message
    log.error = {
      name: error.name,
      message: error.message,
      stack: error.stack
    }
  } else if (typeof error === 'object' && error !== null) {
    // Handle RTK Query errors and other objects
    if ('data' in error && 'status' in error) {
      // RTK Query error format
      const rtkError = error as {status: number | string; data: unknown}
      log.message = `API Error: ${rtkError.status}`
      log.error = {
        status: rtkError.status,
        data: rtkError.data
      }
    } else if ('message' in error) {
      // Object with message property
      const errorObj = error as {message: unknown}
      log.message = String(errorObj.message)
      log.error = {message: String(errorObj.message)}
    } else {
      // Generic object
      log.message = 'Object error'
      log.error = {data: error}
    }
  } else {
    log.message = String(error)
    log.error = {data: error}
  }

  console.error(JSON.stringify(log, null, 2))
}
