/**
 * Log an error to the console.
 *
 * @param error Error to log.
 */
export function logError(error: unknown): void {
  if (error instanceof Error) {
    console.error(`Error: ${error.message}`)
  } else {
    console.error(`Error: ${String(error)}`)
  }
}
