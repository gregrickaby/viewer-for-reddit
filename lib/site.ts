/*
 * The site's name, copy, and outside links: one place for metadata, the
 * brand, and the About and Donate pages. Plain data, so any component may
 * import it.
 */

import type { Metadata } from 'next'

export const SITE = {
  name: 'Viewer for Reddit',
  tagline: 'Surf Reddit without ads or algorithms',
  description:
    'Viewer for Reddit is a clean way to browse Reddit without ads or algorithms. Sign in with your Reddit account to get started.',
  author: { name: 'Greg Rickaby', url: 'https://gregrickaby.com' },
  links: {
    github: 'https://github.com/gregrickaby/viewer-for-reddit',
    issues: 'https://github.com/gregrickaby/viewer-for-reddit/issues',
  },
  donate: [
    {
      label: 'Buy Me a Coffee',
      handle: 'gregrickaby',
      href: 'https://buymeacoffee.com/gregrickaby',
    },
    { label: 'Venmo', handle: '@GregRickaby', href: 'https://venmo.com/u/GregRickaby' },
    { label: 'PayPal', handle: 'GregRickaby', href: 'https://www.paypal.com/paypalme/GregRickaby' },
  ],
} as const

/** The link-preview image (public/social-share.png). */
export const SHARE_IMAGE = {
  url: '/social-share.png',
  width: 1200,
  height: 630,
  alt: SITE.name,
  type: 'image/png',
} as const

/**
 * Open Graph fields every page shares. Next merges metadata shallowly, so a
 * page that sets `openGraph` spreads this in rather than losing it. (The
 * `opengraph-image` file convention doesn't help here: a page's own
 * `openGraph` replaces the image it adds.)
 */
export const OPEN_GRAPH = {
  type: 'website',
  locale: 'en_US',
  siteName: SITE.name,
  title: SITE.name,
  description: SITE.description,
  images: [SHARE_IMAGE],
} satisfies Metadata['openGraph']

/** Pages anyone can open without signing in: the only ones search engines see. */
export const PUBLIC_PAGES = ['/', '/about', '/donate'] as const
