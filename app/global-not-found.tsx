import {ThemeProvider} from '@/components/layout/ThemeProvider/ThemeProvider'
import {
  Button,
  Card,
  ColorSchemeScript,
  Group,
  Stack,
  Text
} from '@mantine/core'
import '@mantine/core/styles.css'
import {IconAlertCircle} from '@tabler/icons-react'
import type {Metadata} from 'next'

/**
 * Metadata for global 404 page.
 */
export const metadata: Metadata = {
  title: '404 - Page Not Found',
  description: 'The page you are looking for does not exist.'
}

/**
 * Global not found page - handles unmatched routes across entire app.
 *
 * This is used when a requested URL doesn't match any route at all.
 * Next.js skips rendering layouts and directly returns this page.
 *
 * NOTE: Must return a full HTML document including <html> and <body> tags.
 * Must import all required global styles and dependencies.
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/not-found
 */
export default function GlobalNotFound() {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ColorSchemeScript defaultColorScheme="auto" />
        <meta name="color-scheme" content="light dark" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
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
            <Card withBorder padding="xl" radius="md">
              <Stack align="center" gap="md">
                <IconAlertCircle size={48} color="var(--mantine-color-red-6)" />
                <Text size="xl" fw={600}>
                  404 - Page Not Found
                </Text>
                <Text size="sm" c="dimmed" ta="center">
                  The page you are looking for does not exist or has been moved.
                </Text>

                <Group>
                  <Button component="a" href="/" variant="filled">
                    Go Home
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
