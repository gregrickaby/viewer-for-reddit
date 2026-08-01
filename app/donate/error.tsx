'use client'

import {ErrorDisplay} from '@/components/ui/ErrorDisplay/ErrorDisplay'
import {logger} from '@/lib/datadog/client'
import {addNextjsError} from '@datadog/browser-rum-nextjs'
import {Container} from '@mantine/core'
import {useEffect} from 'react'

/**
 * Error boundary for the Donate page.
 * Catches errors in /donate, e.g. a failed content.md read.
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
    logger.error('Donate page error', {
      error: error.message,
      context: 'DonatePageError',
      digest: error.digest
    })
  }, [error])

  return (
    <Container size="md" py="xl">
      <ErrorDisplay onReset={reset} />
    </Container>
  )
}
