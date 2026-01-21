'use client'

import {ThemeProvider} from '@/components/layout/ThemeProvider/ThemeProvider'
import {logout} from '@/lib/actions/auth'
import {logger} from '@/lib/utils/logger'
import {
  Button,
  Card,
  ColorSchemeScript,
  Group,
  Stack,
  Text
} from '@mantine/core'
import '@mantine/core/styles.css'
import {IconAlertTriangle, IconHome, IconRefresh} from '@tabler/icons-react'
import {useEffect, useState, useTransition} from 'react'

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
export default function GlobalError({
  error,
  reset
}: Readonly<GlobalErrorProps>) {
  const [isPending, startTransition] = useTransition()
  const [isAuthError, setIsAuthError] = useState(false)

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

    // Check if this is an authentication error
    const authErrorPatterns = [
      'authentication',
      'expired',
      'unauthorized',
      '401',
      'session',
      'token'
    ]
    const errorMessage = error.message.toLowerCase()
    const isAuth = authErrorPatterns.some((pattern) =>
      errorMessage.includes(pattern)
    )
    setIsAuthError(isAuth)
  }, [error])

  /**
   * Handle navigation to home with session cleanup.
   * Clears session and forces full page reload to avoid cached error state.
   */
  const handleGoHome = () => {
    if (isPending) return

    startTransition(async () => {
      try {
        // Clear session if auth error
        if (isAuthError) {
          await logout()
        }
      } catch (err) {
        logger.error('Failed to clear session on home navigation', err)
      } finally {
        // Force full page reload to clear any cached state
        globalThis.location.href = '/'
      }
    })
  }

  return (
    <html lang="en">
      <head>
        <title>Error - Viewer for Reddit</title>
        <ColorSchemeScript defaultColorScheme="auto" />
      </head>
      <body>
        <ThemeProvider>
          <main
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '100vh',
              padding: '1rem'
            }}
          >
            <Card
              shadow="sm"
              padding="xl"
              radius="md"
              withBorder
              style={{maxWidth: '600px', width: '100%'}}
            >
              <Stack align="center" gap="md">
                <IconAlertTriangle
                  size={48}
                  color="var(--mantine-color-red-6)"
                  aria-hidden="true"
                />

                <Text size="xl" fw={700} ta="center">
                  {isAuthError ? 'Session Expired' : 'Something Went Wrong'}
                </Text>

                <Text size="sm" c="dimmed" ta="center">
                  {isAuthError
                    ? 'Your session may have expired. Click below to return home and sign in again.'
                    : "An unexpected error occurred. This has been logged and we'll look into it."}
                </Text>

                {error.digest && (
                  <Text size="xs" c="dimmed" ff="monospace" ta="center">
                    Error ID: {error.digest}
                  </Text>
                )}

                <Group justify="center" gap="md">
                  {!isAuthError && (
                    <Button
                      onClick={reset}
                      variant="filled"
                      leftSection={<IconRefresh size={16} />}
                      aria-label="Try again by reloading the page"
                      disabled={isPending}
                    >
                      Try Again
                    </Button>
                  )}

                  <Button
                    onClick={handleGoHome}
                    variant={isAuthError ? 'filled' : 'outline'}
                    leftSection={<IconHome size={16} />}
                    aria-label="Return to home page"
                    loading={isPending}
                  >
                    {isAuthError ? 'Clear Session & Go Home' : 'Go Home'}
                  </Button>
                </Group>
              </Stack>
            </Card>
          </main>
        </ThemeProvider>
      </body>
    </html>
  )
}
