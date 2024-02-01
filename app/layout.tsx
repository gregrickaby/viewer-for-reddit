import PreloadResources from '@/components/PreloadResources'
import RedditProvider from '@/components/RedditProvider'
import config from '@/lib/config'
import theme from '@/lib/theme'
import {ColorSchemeScript, MantineProvider} from '@mantine/core'
import '@mantine/core/styles.css'
import {Metadata, Viewport} from 'next'

/**
 * Setup metadata.
 *
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/metadata
 */
export const metadata: Metadata = {
  metadataBase: new URL(config.siteUrl),
  title: `${config.siteName} - ${config.siteDescription}`,
  description: config.siteDescription,
  robots: 'follow, index',
  alternates: {
    canonical: config.siteUrl
  },
  manifest: '/manifest.json',
  openGraph: {
    title: config.siteName,
    description: config.metaDescription,
    type: 'website',
    locale: 'en_US',
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
  icons: {
    icon: '/favicon.ico',
    apple: '/icon.png',
    shortcut: '/icon.png'
  },
  other: {
    'google-site-verification':
      process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || ''
  }
}

/**
 * Setup viewport.
 *
 * @see https://nextjs.org/docs/app/api-reference/functions/generate-viewport
 */
export const viewport: Viewport = {
  themeColor: [
    {media: '(prefers-color-scheme: light)', color: 'white'},
    {media: '(prefers-color-scheme: dark)', color: '#1a1b1e'}
  ]
}

/**
 * Root layout component.
 *
 * @see https://nextjs.org/docs/app/building-your-application/routing/pages-and-layouts#root-layout-required
 */
export default function RootLayout({children}: {children: any}) {
  return (
    <html lang="en">
      <head>
        <PreloadResources />
        <ColorSchemeScript />
      </head>
      <body>
        <MantineProvider theme={theme} defaultColorScheme="auto">
          <RedditProvider>{children}</RedditProvider>
        </MantineProvider>
      </body>
    </html>
  )
}
