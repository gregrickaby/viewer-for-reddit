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
      {
        error,
        digest: error.digest,
        name: error.name,
        code: (error as any).code
      },
      {context: 'RootErrorBoundary', forceProduction: true}
    )
  }, [error])

  // In production, Next.js strips error messages but preserves error.digest
  // Check digest for our custom error codes
  const errorDigest = error.digest || ''
  const errorCode = (error as any).code || ''

  // Check if this is an auth error by any available property
  const isAuth =
    isAuthError(error) ||
    errorDigest.includes('AUTH_EXPIRED') ||
    errorCode === 'AUTH_EXPIRED' ||
    error.name === 'AuthenticationError'

  if (isAuth) {
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
