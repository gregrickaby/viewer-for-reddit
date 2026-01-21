import {ThemeProvider} from '@/components/layout/ThemeProvider/ThemeProvider'
import {Analytics} from '@/components/ui/Analytics/Analytics'
import {appConfig} from '@/lib/config/app.config'
import {
  getAnalyticsConfig,
  getOptionalEnvVar,
  isProduction,
  validateEnv
} from '@/lib/utils/env'
import {ColorSchemeScript} from '@mantine/core'
import '@mantine/core/styles.css'
import type {Metadata, Viewport} from 'next'

if (!isProduction()) {
  validateEnv()
}

/**
 * Generate metadata.
 *
 * @see https://nextjs.org/docs/app/api-reference/functions/generate-metadata
 */
export const metadata: Metadata = {
  metadataBase: new URL(appConfig.site.baseUrl),
  title: `${appConfig.site.name} - ${appConfig.site.description}`,
  description: appConfig.site.metaDescription,
  robots: 'follow, index',
  alternates: {
    canonical: appConfig.site.baseUrl
  },
  openGraph: {
    description: appConfig.site.metaDescription,
    locale: 'en_US',
    title: appConfig.site.name,
    type: 'website',
    url: appConfig.site.baseUrl,
    images: [
      {
        url: '/social-share.webp',
        width: 1200,
        height: 630,
        alt: appConfig.site.name
      }
    ]
  },
  verification: {
    google: getOptionalEnvVar('GOOGLE_SITE_VERIFICATION')
  }
}

/**
 * Setup viewport.
 *
 * @see https://nextjs.org/docs/app/api-reference/functions/generate-viewport#the-viewport-object
 */
export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: '#242424'
}

/**
 * Root layout component - wraps entire application.
 *
 * Features:
 * - Mantine theme provider with color scheme support
 * - Global error boundary
 * - Analytics (production only)
 * - Color scheme script for preventing flash
 * - Environment validation (development only)
 *
 * @param children - Page content
 */
export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  const analytics = getAnalyticsConfig()

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ColorSchemeScript defaultColorScheme="auto" />
        <meta name="color-scheme" content="light dark" />
      </head>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
        <Analytics {...analytics} />
      </body>
    </html>
  )
}
