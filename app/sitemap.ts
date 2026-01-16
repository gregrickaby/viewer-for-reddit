import {appConfig} from '@/lib/config/app.config'
import {MetadataRoute} from 'next'

/**
 * Sitemap generator.
 *
 * Only includes static pages for brand discovery.
 * Our value proposition is UX (ad-free viewing), not SEO.
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = appConfig.site.baseUrl

  return [
    {
      url: base,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 1
    },
    {
      url: `${base}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8
    }
  ]
}
