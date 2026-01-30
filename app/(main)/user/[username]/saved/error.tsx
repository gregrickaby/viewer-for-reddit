'use client'

import {ErrorDisplay} from '@/components/ui/ErrorDisplay/ErrorDisplay'
import {logger} from '@/lib/utils/logger'
import {Container} from '@mantine/core'
import {useEffect} from 'react'

/**
 * Error boundary for saved items pages.
 * Catches errors in /user/[username]/saved routes.
 *
 * @param error - Error object with optional digest
 * @param reset - Function to re-render the route segment
 */
export default function Error({
  error,
  reset
}: Readonly<{
  error: Error & {digest?: string}
  reset: () => void
}>) {
  useEffect(() => {
    logger.error('Saved items page error', error, {
      context: 'SavedItemsError',
      digest: error.digest
    })
  }, [error])

  return (
    <Container size="lg">
      <ErrorDisplay onReset={reset} />
    </Container>
  )
}
