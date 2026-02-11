'use client'

import {ErrorDisplay} from '@/components/ui/ErrorDisplay/ErrorDisplay'

/**
 * Error boundary for subreddit search page.
 * Displays a user-friendly error message with retry option.
 */
export default function Error({
  error,
  reset
}: Readonly<{
  error: Error & {digest?: string}
  reset: () => void
}>) {
  return (
    <ErrorDisplay
      title="Search Failed"
      message={error.message || 'Something went wrong while searching.'}
      onClick={reset}
      buttonText="Try Again"
    />
  )
}
