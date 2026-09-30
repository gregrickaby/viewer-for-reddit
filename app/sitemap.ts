import type { MetadataRoute } from 'next'
import { env } from '@/lib/env'
import { PUBLIC_PAGES } from '@/lib/site'

/**
 * When each page's content last changed. Bump the date when you edit a page:
 * a build date would claim every page changed on every deploy.
 */
const UPDATED = {
  '/': '2026-09-29',
  '/about': '2026-09-29',
  '/donate': '2026-09-29',
} as const satisfies Record<(typeof PUBLIC_PAGES)[number], string>

/** The public pages. Reddit content needs a session, so it never appears here. */
export default function sitemap(): MetadataRoute.Sitemap {
  return PUBLIC_PAGES.map((page) => ({
    url: new URL(page, env.BASE_URL).href,
    lastModified: UPDATED[page],
    changeFrequency: page === '/' ? 'weekly' : 'monthly',
    priority: page === '/' ? 1 : 0.5,
  }))
}
