import './styles/layers.css'
import './styles/reset.css'
import './styles/tokens.css'
import './styles/base.css'
import './styles/utilities.css'

import type { Metadata, Viewport } from 'next'
import { DatadogAppRouter } from '@datadog/browser-rum-nextjs'
import { Suspense } from 'react'
import { Reddit_Mono, Reddit_Sans } from 'next/font/google'
import { env } from '@/lib/env'
import { OPEN_GRAPH, SHARE_IMAGE, SITE } from '@/lib/site'

const redditSans = Reddit_Sans({
  subsets: ['latin'],
  variable: '--font-reddit-sans',
  display: 'swap',
})

const redditMono = Reddit_Mono({
  subsets: ['latin'],
  variable: '--font-reddit-mono',
  display: 'swap',
})

/*
 * Applies the saved theme before first paint without reading cookies on the
 * server, which would make every route dynamic (docs/design.md §8.8, and the
 * bundled "Preventing flash before hydration" guide). The regex accepts only
 * known values, so the cookie can't inject anything.
 */
const THEME_SCRIPT = `(function(){try{var m=document.cookie.match(/(?:^|; )rv_theme=(system|light|dark)(?:;|$)/);if(m)document.documentElement.setAttribute("data-theme",m[1])}catch(e){}})()`

/*
 * Site-wide SEO. The icons come from the `favicon`, `icon`, and `apple-icon`
 * files beside this layout; the share image is in `lib/site.ts`. Only the
 * public pages are indexable: the signed-in shell opts out.
 */
export const metadata: Metadata = {
  metadataBase: new URL(env.BASE_URL),
  applicationName: SITE.name,
  title: {
    default: `${SITE.name}: ${SITE.tagline}`,
    template: `%s · ${SITE.name}`,
  },
  description: SITE.description,
  authors: [SITE.author],
  creator: SITE.author.name,
  // Each public page sets its own canonical URL; one here would leak to every page.
  openGraph: OPEN_GRAPH,
  twitter: {
    card: 'summary_large_image',
    title: SITE.name,
    description: SITE.description,
    images: [SHARE_IMAGE],
  },
  robots: { index: true, follow: true },
  verification: env.GOOGLE_SITE_VERIFICATION ? { google: env.GOOGLE_SITE_VERIFICATION } : undefined,
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0e0e10' },
  ],
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="en"
      data-theme="system"
      className={`${redditSans.variable} ${redditMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>
        {env.DD_APPLICATION_ID && env.DD_CLIENT_TOKEN ? (
          <Suspense>
            <DatadogAppRouter />
          </Suspense>
        ) : null}
        {children}
      </body>
    </html>
  )
}
