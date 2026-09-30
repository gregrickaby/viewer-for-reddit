import type { MetadataRoute } from 'next'
import { env } from '@/lib/env'
import { PRIVATE_PREFIXES, PUBLIC_PAGES } from '@/lib/site'

/**
 * Only the public pages are crawlable. Everything else needs a Reddit
 * session, so a crawler would only burn API budget and collect redirects.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: [...PUBLIC_PAGES], disallow: [...PRIVATE_PREFIXES] },
    sitemap: new URL('/sitemap.xml', env.BASE_URL).href,
  }
}
