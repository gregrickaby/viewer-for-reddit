'use client'

import {ErrorDisplay} from '@/components/ui/ErrorDisplay/ErrorDisplay'
import {logger} from '@/lib/datadog/client'
import {addNextjsError} from '@datadog/browser-rum-nextjs'
import {Container} from '@mantine/core'
import {useEffect} from 'react'

/**
 * Error boundary for subreddit pages.
 * Catches errors in /r/[subreddit] routes.
 *
 * @param error - Error object with optional digest
 * @param reset - Function to re-render the route segment
 */
export default function RouteError({
  error,
  reset
}: Readonly<{
  error: Error & {digest?: string}
  reset: () => void
}>) {
  useEffect(() => {
    addNextjsError(error)
    logger.error('Subreddit page error', {
      error: error.message,
      context: 'SubredditPageError',
      digest: error.digest
    })
  }, [error])

  return (
    <Container size="lg">
      <div style={{maxWidth: '800px'}}>
        <ErrorDisplay onReset={reset} />
      </div>
    </Container>
  )
}
