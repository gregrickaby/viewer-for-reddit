'use client'

import {ErrorDisplay} from '@/components/ui/ErrorDisplay/ErrorDisplay'
import {getAuthStatus} from '@/lib/actions/auth/auth'
import {logger} from '@/lib/datadog/client'
import {addNextjsError} from '@datadog/browser-rum-nextjs'
import {Container, Stack} from '@mantine/core'
import {useEffect, useState} from 'react'

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
  retry: () => void
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

  return function RouteError({error, retry}: RouteErrorProps) {
    // Most protected routes already require a session server-side, so most
    // errors here are unrelated to auth. Only show the sign-in prompt once
    // we've confirmed the user is actually signed out - never assume it.
    const [showSignIn, setShowSignIn] = useState(false)

    useEffect(() => {
      addNextjsError(error)
      logger.error(message, {
        error: error.message,
        context,
        digest: error.digest
      })
    }, [error])

    useEffect(() => {
      let cancelled = false

      getAuthStatus()
        .then(({isAuthenticated}) => {
          if (!cancelled && !isAuthenticated) setShowSignIn(true)
        })
        .catch(() => {
          // Can't confirm auth state (e.g. a corrupted session cookie) -
          // leave the sign-in prompt hidden rather than guessing.
        })

      return () => {
        cancelled = true
      }
    }, [])

    const content = centered ? (
      <Stack gap="xl" maw={800} mx="auto">
        <ErrorDisplay showSignIn={showSignIn} onRetry={retry} />
      </Stack>
    ) : (
      <ErrorDisplay showSignIn={showSignIn} onRetry={retry} />
    )

    if (!containerSize) return content

    return (
      <Container size={containerSize} py={containerPy}>
        {content}
      </Container>
    )
  }
}
