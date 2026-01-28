'use client'

import {ThemeProvider} from '@/components/layout/ThemeProvider/ThemeProvider'
import {ErrorDisplay} from '@/components/ui/ErrorDisplay/ErrorDisplay'
import {logger} from '@/lib/utils/logger'
import {Card, Center, ColorSchemeScript, Stack} from '@mantine/core'
import '@mantine/core/styles.css'
import {useEffect} from 'react'

/**
 * Props for GlobalError component.
 */
interface GlobalErrorProps {
  error: Error & {digest?: string}
  reset: () => void
}

/**
 * Global error boundary - catches errors in root layout and templates.
 *
 * This component handles unexpected runtime errors at the application root level.
 * It's invoked when errors occur in the root layout or template components.
 *
 * CRITICAL NOTES:
 * - Must be a Client Component ('use client')
 * - Must include <html> and <body> tags (replaces root layout when active)
 * - Cannot use Next.js metadata exports (use React <title> component)
 * - Must import all global styles and dependencies
 * - Less common than error.tsx but crucial for root-level error handling
 *
 * Features:
 * - Logs errors to console and error reporting service
 * - Provides user-friendly error UI with Mantine components
 * - Offers reset functionality to attempt recovery
 * - Includes navigation to home page
 * - Displays error digest for debugging (production)
 * - Full theme support via ThemeProvider
 *
 * @param error - Error object with optional digest
 * @param reset - Function to attempt recovery by re-rendering
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/error#global-error
 * @see https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary
 *
 * @example
 * ```typescript
 * // Automatically invoked by Next.js when root layout errors occur
 * // No manual usage required
 * ```
 */
export default function GlobalError({error}: Readonly<GlobalErrorProps>) {
  /**
   * Log error to console and error reporting service on mount.
   * Runs only once when component mounts.
   */
  useEffect(() => {
    logger.error('Global error boundary caught error', error, {
      context: 'GlobalError',
      digest: error.digest,
      message: error.message,
      stack: error.stack
    })
  }, [error])

  return (
    <html lang="en">
      <head>
        <title>Error - Viewer for Reddit</title>
        <ColorSchemeScript defaultColorScheme="auto" />
      </head>
      <body>
        <ThemeProvider>
          <Center component="main" mih="100vh" p="md">
            <Card w="100%" maw={600} padding="xl" radius="md" withBorder>
              <Stack align="center" gap="md">
                <ErrorDisplay />
              </Stack>
            </Card>
          </Center>
        </ThemeProvider>
      </body>
    </html>
  )
}
