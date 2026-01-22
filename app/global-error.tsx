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
import {useEffect, useTransition} from 'react'

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
/**
 * Check if error is an authentication error based on message patterns.
 */
function isAuthError(error: Error): boolean {
  const message = error.message.toLowerCase()
  const authPatterns = [
    'authentication',
    'auth',
    'token',
    'expired',
    '401',
    'unauthorized',
    'session'
  ]
  return authPatterns.some((pattern) => message.includes(pattern))
}

export default function GlobalError({
  error,
  reset
}: Readonly<GlobalErrorProps>) {
  const [isPending, startTransition] = useTransition()
  const isAuth = isAuthError(error)

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

  /**
   * Handle navigation home, clearing session first if auth error.
   */
  const handleGoHome = () => {
    if (isPending) return

    startTransition(async () => {
      if (isAuth) {
        await logout()
      }
      window.location.href = '/'
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
                  Something Went Wrong
                </Text>

                <Text size="sm" c="dimmed" ta="center">
                  {isAuth
                    ? 'Your session may have expired. Please log in again to continue.'
                    : "An unexpected error occurred. This has been logged and we'll look into it. If you're stuck, please try clearing your browser cache and cookies."}
                </Text>

                {error.digest && (
                  <Text size="xs" c="dimmed" ff="monospace" ta="center">
                    Error ID: {error.digest}
                  </Text>
                )}

                <Group justify="center" gap="md">
                  {!isAuth && (
                    <Button
                      onClick={reset}
                      variant="filled"
                      leftSection={<IconRefresh size={16} />}
                      aria-label="Try again by reloading the page"
                    >
                      Try Again
                    </Button>
                  )}

                  <Button
                    onClick={handleGoHome}
                    variant={isAuth ? 'filled' : 'outline'}
                    leftSection={<IconHome size={16} />}
                    aria-label="Return to home page"
                    disabled={isPending}
                  >
                    {isAuth ? 'Clear Session & Go Home' : 'Go Home'}
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
