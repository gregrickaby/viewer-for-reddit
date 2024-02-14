import config from '@/lib/config'
import {MetadataRoute} from 'next'

/**
 * Route segment config.
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config
 */
export const revalidate = 43200 // 12 hours

/**
 * Sitemap generator.
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: config.siteUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1
    }
  ]
}
