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

export type FeatureIconName =
  | 'no-ads'
  | 'sort'
  | 'layers'
  | 'user'
  | 'lock'
  | 'code'
  | 'read'
  | 'chat'
  | 'play'
  | 'moon'
  | 'server'
  | 'heart'
  | 'star'
  | 'bug'
  | 'share'

/** The landing page's reasons to sign in: a short title and one sentence each. */
export const FEATURES: ReadonlyArray<{ icon: FeatureIconName; title: string; text: string }> = [
  {
    icon: 'no-ads',
    title: 'No ads',
    text: 'Every post you see is real. The site sells no ad space, and promoted posts never appear.',
  },
  {
    icon: 'sort',
    title: 'You pick the sort',
    text: 'Choose Best, Hot, New, Top, or Rising. Pick New to read posts in the order they were made.',
  },
  {
    icon: 'layers',
    title: 'Multireddits',
    text: 'Mix your favorite communities into one custom feed.',
  },
  {
    icon: 'user',
    title: 'Your account',
    text: 'Sign in and see your subscriptions, saved posts, and votes, as on reddit.com.',
  },
  {
    icon: 'lock',
    title: 'Secure sign-in',
    text: 'You sign in on reddit.com with Reddit’s own login. Your password never reaches this site.',
  },
  {
    icon: 'code',
    title: 'Open source',
    text: 'The code is on GitHub. Read it, fork it, run your own copy, or send a pull request.',
  },
]

/** How it works, in order. */
export const STEPS = [
  {
    title: 'Sign in on Reddit',
    text: 'Press the button and approve access on reddit.com. Your password stays with Reddit.',
  },
  {
    title: 'Choose what to read',
    text: 'Open your home feed, a community, or a multireddit, and pick a sort.',
  },
  {
    title: 'Read and join in',
    text: 'Vote, save, comment, and reply. Each action shows up at once.',
  },
] as const

/** A link inside an FAQ answer: to a page on this site, or out to a service or its documentation. */
export type FaqLink =
  | { text: string; href: string; page?: undefined }
  | { text: string; page: '/about' | '/donate'; href?: undefined }

const REDDIT_OAUTH = 'https://github.com/reddit-archive/reddit/wiki/oauth2'
const REDDIT_APPS = 'https://www.reddit.com/prefs/apps'

/**
 * FAQ answers as text and links, so the landing page can point readers to the
 * services and documentation each answer names, without any raw HTML.
 */
export const FAQ: ReadonlyArray<{
  question: string
  answer: ReadonlyArray<string | FaqLink>
}> = [
  {
    question: 'How is this different from reddit.com?',
    answer: [
      'There are no ads or promoted posts, and you pick the sort. The site is built with ',
      { text: 'Next.js', href: 'https://nextjs.org/' },
      ': its server makes every request to Reddit and sends pages already rendered.',
    ],
  },
  {
    question: 'Why do I have to sign in?',
    answer: [
      'Reddit ended public access to its API in June 2026. Apps like this one can’t read anything without your Reddit account. Reddit explains how apps get access in its ',
      { text: 'API documentation', href: 'https://www.reddit.com/dev/api' },
      '. If you don’t have an account, ',
      { text: 'register on Reddit', href: 'https://www.reddit.com/register/' },
      '.',
    ],
  },
  {
    question: 'Is my data safe?',
    answer: [
      'Sign-in uses Reddit’s ',
      { text: 'official OAuth2 flow', href: REDDIT_OAUTH },
      ', so your password never reaches this site. Your access tokens stay in encrypted cookies in your browser, and you can revoke access anytime in your ',
      { text: 'Reddit app settings', href: REDDIT_APPS },
      '. The ',
      { text: 'About page', page: '/about' },
      ' lists what the site records.',
    ],
  },
  {
    question: 'Is it free?',
    answer: [
      'Yes, and it has no ads. Donations pay for hosting, the domain, and development tools. See ',
      { text: 'how to donate', page: '/donate' },
      '.',
    ],
  },
  {
    question: 'Does it work on my phone?',
    answer: ['Yes. It works on phones, tablets, and desktops, in light and dark mode.'],
  },
  {
    question: 'Can I run my own copy?',
    answer: [
      'Yes. The code is open source on ',
      { text: 'GitHub', href: SITE.links.github },
      ', and the ',
      { text: 'README', href: `${SITE.links.github}#setup` },
      ' lists the setup steps. Create your own app on ',
      { text: 'Reddit’s app page', href: REDDIT_APPS },
      ', then add your keys.',
    ],
  },
]

/** Shown in every public page footer. */
export const DISCLAIMER = `${SITE.name} is an independent project, not affiliated with Reddit, Inc. “Reddit” and the Snoo logo are trademarks of Reddit, Inc.`

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

/** Twitter card fields, shared like `OPEN_GRAPH`: a page that sets `twitter` replaces the layout's whole object. */
export const TWITTER = {
  card: 'summary_large_image',
  title: SITE.name,
  description: SITE.description,
  images: [SHARE_IMAGE],
} satisfies Metadata['twitter']

/** Pages anyone can open without signing in: the only ones search engines see. */
export const PUBLIC_PAGES = ['/', '/about', '/donate'] as const

/**
 * Prefixes that need a Reddit session: the signed-in shell and the API routes.
 * `robots.txt` disallows them, and the proxy sends signed-out readers of them to
 * sign in. Anything else is either public or an address the site doesn't have,
 * and gets the 404 page. Add a prefix here when you add a signed-in route.
 */
export const PRIVATE_PREFIXES = [
  '/active',
  '/api/',
  '/home',
  '/live/',
  '/m/',
  '/multis',
  '/r/',
  '/saved',
  '/search',
  '/settings',
  '/subreddits',
  '/user/',
] as const

/** Whether a path is under a signed-in prefix: `/home` and `/home/x`, but not `/homes`. */
export function isPrivatePath(pathname: string): boolean {
  return PRIVATE_PREFIXES.some((prefix) => {
    const base = prefix.endsWith('/') ? prefix.slice(0, -1) : prefix
    return pathname === base || pathname.startsWith(`${base}/`)
  })
}

/** Schema.org data for the landing page: what the site is and who makes it. */
export function structuredData(baseUrl: string) {
  const url = new URL('/', baseUrl).href
  const author = { '@type': 'Person', name: SITE.author.name, url: SITE.author.url }
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${url}#website`,
        url,
        name: SITE.name,
        description: SITE.description,
        inLanguage: 'en',
        publisher: author,
      },
      {
        '@type': 'WebApplication',
        '@id': `${url}#app`,
        url,
        name: SITE.name,
        description: SITE.description,
        applicationCategory: 'SocialNetworkingApplication',
        operatingSystem: 'Any',
        isAccessibleForFree: true,
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        author,
        sameAs: [SITE.links.github],
      },
    ],
  }
}
