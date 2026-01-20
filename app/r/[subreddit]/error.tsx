'use client'

import {AuthExpiredError} from '@/components/ui/AuthExpiredError'
import {ErrorDisplay} from '@/components/ui/ErrorDisplay/ErrorDisplay'
import {logger} from '@/lib/utils/logger'
import {useEffect} from 'react'

/**
 * Error boundary for subreddit pages.
 * Catches errors from Server Components in subreddit routes.
 *
 * Features:
 * - Detects authentication errors and shows AuthExpiredError
 * - Shows generic ErrorDisplay for other errors (404, network, etc.)
 * - Logs errors for debugging
 *
 * @param error - The error that was thrown
 * @param reset - Function to reset the error boundary
 */
export default function SubredditError({
  error,
  reset
}: Readonly<{
  error: Error & {digest?: string}
  reset: () => void
}>) {
  useEffect(() => {
    logger.error(
      'Subreddit page error caught',
      {error, digest: error.digest},
      {context: 'SubredditErrorBoundary', forceProduction: true}
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
  if (errorMessage.includes('Subreddit not found')) {
    return (
      <ErrorDisplay
        title="Subreddit not found"
        message="This subreddit doesn't exist or has been banned."
        onClick={reset}
        showRetry={false}
        showHome
      />
    )
  }

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
      title="Failed to load subreddit"
      message={
        errorMessage || 'Unable to load this subreddit. Please try again.'
      }
      onClick={reset}
      showRetry
      showHome
    />
  )
}
