'use cache'

import {Analytics} from '@/components/Analytics/Analytics'
import config from '@/lib/config'
import {StoreProvider} from '@/lib/store/StoreProvider'
import {
  ColorSchemeScript,
  MantineProvider,
  createTheme,
  mantineHtmlProps,
  type MantineColorsTuple
} from '@mantine/core'
import '@mantine/core/styles.css'
import {Notifications} from '@mantine/notifications'
import '@mantine/notifications/styles.css'
import type {Metadata, Viewport} from 'next'
import {Reddit_Sans} from 'next/font/google'

/**
 * Generate metadata.
 *
 * @see https://nextjs.org/docs/app/api-reference/functions/generate-metadata
 */
export const metadata: Metadata = {
  metadataBase: new URL(config.baseUrl),
  title: `${config.siteName} - ${config.siteDescription}`,
  description: config.metaDescription,
  robots: 'follow, index',
  alternates: {
    canonical: config.baseUrl
  },
  openGraph: {
    description: config.metaDescription,
    locale: 'en_US',
    title: config.siteName,
    type: 'website',
    url: config.baseUrl,
    images: [
      {
        url: 'social-share.webp',
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
  themeColor: '#242424'
}

/**
 * Load fonts.
 *
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/fonts
 * @see https://redditbrand.lingoapp.com/s/Typography-d03Ney?v=40
 */
const redditSans = Reddit_Sans({
  subsets: ['latin'],
  weight: ['400', '700'],
  display: 'swap'
})

/**
 * Set the color scheme based on Reddit's branding.
 *
 * @see https://mantine.dev/theming/colors/#primarycolor
 * @see https://redditbrand.lingoapp.com/s/Color-R7y72J?v=40
 */
const redditColorScheme: MantineColorsTuple = [
  '#ffeee4',
  '#ffdbcd',
  '#ffb69b',
  '#ff8e64',
  '#fe6d37',
  '#fe5719',
  '#ff4500',
  '#e43c00',
  '#cb3400',
  '#b22900'
]

/**
 * Create Mantine theme.
 *
 * @see https://mantine.dev/theming/theme-object/
 */
const theme = createTheme({
  colors: {redditColorScheme},
  fontFamily: redditSans.style.fontFamily,
  primaryColor: 'redditColorScheme'
})

/**
 * The server-rendered root layout component.
 *
 * This component wraps all pages and components in the application.
 *
 * @see https://nextjs.org/docs/app/getting-started/layouts-and-pages#root-layout
 */
export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <StoreProvider>
      <html lang="en" {...mantineHtmlProps} className={redditSans.className}>
        <head>
          <ColorSchemeScript defaultColorScheme="auto" />
          <Analytics />
        </head>
        <body>
          <MantineProvider theme={theme} defaultColorScheme="auto">
            {children}
            <Notifications />
          </MantineProvider>
        </body>
      </html>
    </StoreProvider>
  )
}
