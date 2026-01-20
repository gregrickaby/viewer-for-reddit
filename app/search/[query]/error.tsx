'use client'

import {AuthExpiredError} from '@/components/ui/AuthExpiredError'
import {ErrorDisplay} from '@/components/ui/ErrorDisplay/ErrorDisplay'
import {logger} from '@/lib/utils/logger'
import {useEffect} from 'react'

/**
 * Error boundary for search results pages.
 * Catches errors from Server Components in search routes.
 *
 * Features:
 * - Detects authentication errors and shows AuthExpiredError
 * - Shows generic ErrorDisplay for other errors (network, rate limit, etc.)
 * - Logs errors for debugging
 *
 * @param error - The error that was thrown
 * @param reset - Function to reset the error boundary
 */
export default function SearchError({
  error,
  reset
}: Readonly<{
  error: Error & {digest?: string}
  reset: () => void
}>) {
  useEffect(() => {
    logger.error(
      'Search page error caught',
      {error, digest: error.digest},
      {context: 'SearchErrorBoundary', forceProduction: true}
    )
  }, [error])

  // Check if error is authentication-related
  const errorMessage = error.message || ''
  const isAuthError =
    errorMessage.includes('Authentication expired') ||
    errorMessage.includes('Session expired') ||
    errorMessage.includes('Authentication required')

  if (isAuthError) {
    return <AuthExpiredError />
  }

  // Handle specific error types
  if (errorMessage.includes('Rate limit exceeded')) {
    return (
      <ErrorDisplay
        title="Too many requests"
        message={errorMessage}
        onClick={reset}
        showRetry
        showHome
      />
    )
  }

  return (
    <ErrorDisplay
      title="Search failed"
      message={errorMessage || 'Unable to complete search. Please try again.'}
      onClick={reset}
      showRetry
      showHome
    />
  )
}
