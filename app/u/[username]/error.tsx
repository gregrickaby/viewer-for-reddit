'use client'

import {AuthExpiredError} from '@/components/ui/AuthExpiredError'
import {ErrorDisplay} from '@/components/ui/ErrorDisplay/ErrorDisplay'
import {logger} from '@/lib/utils/logger'
import {useEffect} from 'react'

/**
 * Error boundary for user profile pages.
 * Catches errors from Server Components in user profile routes.
 *
 * Features:
 * - Detects authentication errors and shows AuthExpiredError
 * - Shows generic ErrorDisplay for other errors (404, network, etc.)
 * - Logs errors for debugging
 *
 * @param error - The error that was thrown
 * @param reset - Function to reset the error boundary
 */
export default function UserProfileError({
  error,
  reset
}: Readonly<{
  error: Error & {digest?: string}
  reset: () => void
}>) {
  useEffect(() => {
    logger.error(
      'User profile page error caught',
      {error, digest: error.digest},
      {context: 'UserProfileErrorBoundary', forceProduction: true}
    )
  }, [error])

  // Check if error is authentication-related
  // Match exact error messages from server actions (lib/actions/reddit.ts)
  const errorMessage = error.message || ''
  const isAuthError =
    errorMessage === 'Authentication expired' ||
    errorMessage === 'Session expired' ||
    errorMessage === 'Authentication required'

  if (isAuthError) {
    return <AuthExpiredError />
  }

  // Handle specific error types
  if (errorMessage === 'User not found') {
    return (
      <ErrorDisplay
        title="User not found"
        message="This user account doesn't exist or has been deleted."
        onClick={reset}
        showRetry={false}
        showHome
      />
    )
  }

  if (errorMessage.startsWith('Rate limit exceeded')) {
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
      title="Failed to load profile"
      message={
        errorMessage || 'Unable to load this user profile. Please try again.'
      }
      onClick={reset}
      showRetry
      showHome
    />
  )
}
