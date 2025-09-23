/**
 * Log an error to the console.
 *
 * @param error Error to log.
 */
export function logError(error: unknown): void {
  if (error instanceof Error) {
    console.error(`Error: ${error.message}`)
  } else if (typeof error === 'object' && error !== null) {
    // Handle RTK Query errors and other objects
    if ('data' in error && 'status' in error) {
      // RTK Query error format
      console.error(`Error: ${error.status} - ${JSON.stringify(error.data)}`)
    } else if ('message' in error) {
      // Object with message property
      console.error(`Error: ${String((error as {message: unknown}).message)}`)
    } else {
      // Generic object
      console.error(`Error: ${JSON.stringify(error)}`)
    }
  } else {
    console.error(`Error: ${String(error)}`)
  }
}
