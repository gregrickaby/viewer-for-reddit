import { StoreProvider } from '@/components/StoreProvider'
import config from '@/lib/config'
import type { Metadata } from 'next'
import './globals.css'

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
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION ?? ''
  }
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
      <html lang="en">
        <body>{children}</body>
      </html>
    </StoreProvider>
  )
}
