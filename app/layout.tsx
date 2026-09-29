import './styles/layers.css'
import './styles/reset.css'
import './styles/tokens.css'
import './styles/base.css'
import './styles/utilities.css'

import type { Metadata, Viewport } from 'next'
import { Reddit_Mono, Reddit_Sans } from 'next/font/google'
import { env } from '@/lib/env'

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

export const metadata: Metadata = {
  title: {
    default: 'Reddit Viewer',
    template: '%s · Reddit Viewer',
  },
  description: 'A fast, server-first Reddit client.',
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
      <body>{children}</body>
    </html>
  )
}
