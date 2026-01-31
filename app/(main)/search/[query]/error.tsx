'use client'

import {ErrorDisplay} from '@/components/ui/ErrorDisplay/ErrorDisplay'
import {logger} from '@/lib/utils/logger'
import {Container, Stack} from '@mantine/core'
import {useEffect} from 'react'

/**
 * Error boundary for search pages.
 * Catches errors in /search/[query] routes.
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
    logger.error('Search page error', error, {
      context: 'SearchPageError',
      digest: error.digest
    })
  }, [error])

  return (
    <Container size="lg">
      <Stack gap="xl" maw={800}>
        <ErrorDisplay onReset={reset} />
      </Stack>
    </Container>
  )
}
