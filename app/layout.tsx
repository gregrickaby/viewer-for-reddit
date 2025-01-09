import '@/app/globals.css'
import Footer from '@/components/Footer'
import Header from '@/components/Header'
import Search from '@/components/Search'
import config from '@/lib/config'
import type {Metadata, Viewport} from 'next'
import Script from 'next/script'
import NextTopLoader from 'nextjs-toploader'

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
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ?? ''
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
    <html lang="en">
      <body>
        <NextTopLoader />
        <Header />
        <Search />
        <main>{children}</main>
        <Footer />
        {process.env.NODE_ENV === 'production' && (
          <Script
            async
            crossOrigin="anonymous"
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.GOOGLE_ADSENSE}`}
            strategy="afterInteractive"
          />
        )}
      </body>
    </html>
  )
}
