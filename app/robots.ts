import type { MetadataRoute } from 'next'
import { env } from '@/lib/env'
import { PUBLIC_PAGES } from '@/lib/site'

/** Prefixes that need a Reddit session: the signed-in shell and the auth/API routes. */
const PRIVATE_PREFIXES = [
  '/api/',
  '/home',
  '/m/',
  '/multis',
  '/r/',
  '/saved',
  '/search',
  '/settings',
  '/subreddits',
  '/user/',
]

/**
 * Only the public pages are crawlable. Everything else needs a Reddit
 * session, so a crawler would only burn API budget and collect redirects.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: [...PUBLIC_PAGES], disallow: PRIVATE_PREFIXES },
    sitemap: new URL('/sitemap.xml', env.BASE_URL).href,
  }
}
