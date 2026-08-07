'use client'

import {logger} from '@/lib/datadog/client'
import {addNextjsError} from '@datadog/browser-rum-nextjs'
import {useEffect} from 'react'

/**
 * Error boundary for the root layout itself.
 * Catches errors that error.tsx can't (failures in app/layout.tsx).
 * Must define its own <html>/<body> - Mantine's provider lives in the
 * layout this replaces, so no Mantine components are available here.
 *
 * @param error - Error object with optional digest
 * @param retry - Function to re-fetch and re-render the root layout
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/error#global-error
 */
export default function GlobalError({
  error,
  retry
}: Readonly<{
  error: Error & {digest?: string}
  retry: () => void
}>) {
  useEffect(() => {
    addNextjsError(error)
    logger.error('Root layout error', {
      error: error.message,
      context: 'GlobalError',
      digest: error.digest
    })
  }, [error])

  return (
    <html lang="en">
      <body
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          margin: 0,
          padding: '2rem',
          fontFamily:
            '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
          textAlign: 'center'
        }}
      >
        <h1>Something went wrong</h1>
        <p>An unexpected error occurred. Please try again.</p>
        <button
          type="button"
          onClick={retry}
          style={{
            marginTop: '1rem',
            padding: '0.5rem 1.5rem',
            cursor: 'pointer'
          }}
        >
          Try again
        </button>
      </body>
    </html>
  )
}
