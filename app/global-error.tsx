'use client'

import {Button, Card, ColorSchemeScript, Stack, Text} from '@mantine/core'
import '@mantine/core/styles.css'
import {IconAlertCircle} from '@tabler/icons-react'

/**
 * Global error boundary - catches errors in root layout.
 * Replaces root layout when active, so must include html/body tags.
 *
 * This is ONLY used for errors in app/layout.tsx itself.
 * All other errors are caught by app/error.tsx or route-specific error.tsx files.
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/error#global-error
 */
export default function GlobalError({
  error,
  reset
}: Readonly<{
  error: Error & {digest?: string}
  reset: () => void
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ColorSchemeScript defaultColorScheme="auto" />
        <meta name="color-scheme" content="light dark" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <main
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            padding: '1rem'
          }}
        >
          <Card withBorder padding="xl" radius="md" style={{maxWidth: 600}}>
            <Stack align="center" gap="md">
              <IconAlertCircle size={48} color="var(--mantine-color-red-6)" />
              <Text size="xl" fw={600}>
                Something went wrong!
              </Text>
              <Text size="sm" c="dimmed" ta="center">
                A critical error occurred. Please try reloading the page.
              </Text>

              {error.digest && (
                <Text size="xs" c="dimmed">
                  Error ID: {error.digest}
                </Text>
              )}

              <Button onClick={reset} variant="filled">
                Try again
              </Button>
            </Stack>
          </Card>
        </main>
      </body>
    </html>
  )
}
