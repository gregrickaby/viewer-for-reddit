'use client'

import {AuthExpiredError} from '@/components/ui/AuthExpiredError'
import {ErrorDisplay} from '@/components/ui/ErrorDisplay/ErrorDisplay'
import {logger} from '@/lib/utils/logger'
import {useEffect} from 'react'

/**
 * Error boundary for post detail pages.
 * Catches errors from Server Components in post detail routes.
 *
 * Features:
 * - Detects authentication errors and shows AuthExpiredError
 * - Shows generic ErrorDisplay for other errors (404, network, etc.)
 * - Logs errors for debugging
 *
 * @param error - The error that was thrown
 * @param reset - Function to reset the error boundary
 */
export default function PostError({
  error,
  reset
}: Readonly<{
  error: Error & {digest?: string}
  reset: () => void
}>) {
  useEffect(() => {
    logger.error(
      'Post page error caught',
      {error, digest: error.digest},
      {context: 'PostErrorBoundary', forceProduction: true}
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
  if (errorMessage.includes('Post not found')) {
    return (
      <ErrorDisplay
        title="Post not found"
        message="This post may have been deleted or removed."
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
      title="Failed to load post"
      message={errorMessage || 'Unable to load this post. Please try again.'}
      onClick={reset}
      showRetry
      showHome
    />
  )
}
