import Footer from '@/components/Footer'
import Header from '@/components/Header'
import Search from '@/components/Search'
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
 * The root layout.
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
            <Header />
            <Search />
            <main>{children}</main>
            <Footer />
          </MantineProvider>
        </body>
      </html>
    </StoreProvider>
  )
}
