import {StoreProvider} from '@/components/StoreProvider'
import config from '@/lib/config'
import {
  ColorSchemeScript,
  MantineProvider,
  mantineHtmlProps
} from '@mantine/core'
import '@mantine/core/styles.css'
import {NavigationProgress} from '@mantine/nprogress'
import '@mantine/nprogress/styles.css'
import '@mantine/spotlight/styles.css'
import type {Metadata, Viewport} from 'next'

/**
 * Generate metadata.
 *
 * @see https://nextjs.org/docs/app/api-reference/functions/generate-metadata
 */
export const metadata: Metadata = {
  metadataBase: new URL(config.siteUrl),
  title: `${config.siteName} - ${config.siteDescription}`,
  description: config.metaDescription,
  robots: 'follow, index',
  alternates: {
    canonical: config.siteUrl
  },
  openGraph: {
    description: config.metaDescription,
    locale: 'en_US',
    title: config.siteName,
    type: 'website',
    url: config.siteUrl,
    images: [
      {
        url: `${config.siteUrl}social-share.webp`,
        width: 1200,
        height: 630,
        alt: config.siteName
      }
    ]
  },
  manifest: '/manifest.webmanifest',
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION ?? ''
  }
}

/**
 * Setup viewport.
 *
 * @see https://nextjs.org/docs/app/api-reference/functions/generate-viewport#the-viewport-object
 */
export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#18181b'
}

/**
 * The server-rendered root layout component.
 *
 * This component sets up the global layout for the application.
 * It includes the MantineProvider for theming and styles,
 * and the StoreProvider for Redux state management.
 *
 * It also handles the initial color scheme, SEO metadata, and viewport settings.
 */
export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <StoreProvider>
      <html lang="en" {...mantineHtmlProps}>
        <head>
          <ColorSchemeScript defaultColorScheme="auto" />
        </head>
        <body>
          <MantineProvider defaultColorScheme="auto">
            <NavigationProgress />
            {children}
          </MantineProvider>
        </body>
      </html>
    </StoreProvider>
  )
}
