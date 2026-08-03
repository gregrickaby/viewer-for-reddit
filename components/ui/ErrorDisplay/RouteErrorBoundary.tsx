'use client'

import {ErrorDisplay} from '@/components/ui/ErrorDisplay/ErrorDisplay'
import {logger} from '@/lib/datadog/client'
import {addNextjsError} from '@datadog/browser-rum-nextjs'
import {Container, Stack} from '@mantine/core'
import {useEffect} from 'react'

interface RouteErrorBoundaryConfig {
  /** Datadog log message, e.g. "Search page error" */
  message: string
  /** Datadog log context tag, e.g. "SearchPageError" */
  context: string
  /** Mantine Container size; omit to render ErrorDisplay unwrapped */
  containerSize?: string
  /** Container vertical padding */
  containerPy?: string
  /** Wrap ErrorDisplay in a Stack centered at 800px */
  centered?: boolean
}

type RouteErrorProps = Readonly<{
  error: Error & {digest?: string}
  reset: () => void
}>

/**
 * Builds a Next.js `error.tsx` default export that reports to Datadog and
 * renders `ErrorDisplay` inside route-specific layout wrapping.
 *
 * @param config - Log message/context and container layout for this route
 * @returns A Client Component suitable as an `error.tsx` default export
 */
export function createRouteErrorBoundary(config: RouteErrorBoundaryConfig) {
  const {message, context, containerSize, containerPy, centered} = config

  return function RouteError({error, reset}: RouteErrorProps) {
    useEffect(() => {
      addNextjsError(error)
      logger.error(message, {
        error: error.message,
        context,
        digest: error.digest
      })
    }, [error])

    const content = centered ? (
      <Stack gap="xl" maw={800} mx="auto">
        <ErrorDisplay onReset={reset} />
      </Stack>
    ) : (
      <ErrorDisplay onReset={reset} />
    )

    if (!containerSize) return content

    return (
      <Container size={containerSize} py={containerPy}>
        {content}
      </Container>
    )
  }
}
