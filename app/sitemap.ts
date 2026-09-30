import type { MetadataRoute } from 'next'
import { env } from '@/lib/env'
import { PUBLIC_PAGES } from '@/lib/site'

/** The public pages. Reddit content needs a session, so it never appears here. */
export default function sitemap(): MetadataRoute.Sitemap {
  return PUBLIC_PAGES.map((page) => ({
    url: new URL(page, env.BASE_URL).href,
    changeFrequency: page === '/' ? 'weekly' : 'monthly',
    priority: page === '/' ? 1 : 0.5,
  }))
}
