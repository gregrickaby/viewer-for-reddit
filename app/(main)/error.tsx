'use client'

import {ErrorDisplay} from '@/components/ui/ErrorDisplay/ErrorDisplay'
import {logger} from '@/lib/utils/logger'
import {useEffect} from 'react'

/**
 * Error boundary for main layout routes.
 * Catches errors in /, /r/*, /u/*, /search/*, etc.
 *
 * Next.js automatically wraps route segments with this error boundary.
 * Provides reset functionality to attempt recovery.
 *
 * @param error - Error object with optional digest
 * @param reset - Function to re-render the route segment
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/error
 */
export default function RouteError({
  error,
  reset
}: Readonly<{
  error: Error & {digest?: string}
  reset: () => void
}>) {
  useEffect(() => {
    logger.error('Route error caught', error, {
      context: 'MainLayoutError',
      digest: error.digest
    })
  }, [error])

  return <ErrorDisplay onReset={reset} />
}
