'use client'

import {AuthExpiredError} from '@/components/ui/AuthExpiredError'
import {ErrorDisplay} from '@/components/ui/ErrorDisplay/ErrorDisplay'
import {isAuthError} from '@/lib/utils/errors'
import {
  AppShell,
  ColorSchemeScript,
  Container,
  MantineProvider
} from '@mantine/core'
import '@mantine/core/styles.css'

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
  // Check if this is an auth error
  const errorDigest = error.digest || ''
  const errorCode = (error as any).code || ''

  const isAuth =
    isAuthError(error) ||
    errorDigest.includes('AUTH_EXPIRED') ||
    errorCode === 'AUTH_EXPIRED' ||
    error.name === 'AuthenticationError'

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ColorSchemeScript defaultColorScheme="auto" />
        <meta name="color-scheme" content="light dark" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <MantineProvider defaultColorScheme="auto">
          <AppShell padding="md">
            <AppShell.Main>
              <Container size="lg" style={{paddingTop: '4rem'}}>
                <div style={{maxWidth: '600px', margin: '0 auto'}}>
                  {isAuth ? (
                    <AuthExpiredError />
                  ) : (
                    <ErrorDisplay
                      title="Something went wrong"
                      message={
                        error.message ||
                        'A critical error occurred. Please try again.'
                      }
                      onClick={reset}
                      showRetry
                      showHome
                    />
                  )}
                </div>
              </Container>
            </AppShell.Main>
          </AppShell>
        </MantineProvider>
      </body>
    </html>
  )
}
