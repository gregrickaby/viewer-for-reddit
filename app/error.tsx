'use client'

import {AuthExpiredError} from '@/components/ui/AuthExpiredError'
import {ErrorDisplay} from '@/components/ui/ErrorDisplay/ErrorDisplay'
import {isAuthError} from '@/lib/utils/errors'
import {logger} from '@/lib/utils/logger'
import {useEffect} from 'react'

/**
 * Root error boundary for the application.
 * Catches errors from Server Components at the app root level.
 *
 * Features:
 * - Detects authentication errors and shows AuthExpiredError
 * - Shows generic ErrorDisplay for other errors
 * - Logs errors for debugging
 *
 * @param error - The error that was thrown
 * @param reset - Function to reset the error boundary
 */
export default function Error({
  error,
  reset
}: Readonly<{
  error: Error & {digest?: string}
  reset: () => void
}>) {
  useEffect(() => {
    logger.error(
      'App-level error caught',
      {error, digest: error.digest},
      {context: 'RootErrorBoundary', forceProduction: true}
    )
  }, [error])

  // Check if error is authentication-related using error.code property
  // The code property survives Next.js serialization in production
  if (isAuthError(error)) {
    return <AuthExpiredError />
  }

  const errorMessage = error.message || ''

  return (
    <ErrorDisplay
      title="Something went wrong"
      message={
        errorMessage || 'An unexpected error occurred. Please try again.'
      }
      onClick={reset}
      showRetry
      showHome
    />
  )
}
