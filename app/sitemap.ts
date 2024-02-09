import {MetadataRoute} from 'next'
import config from '@/lib/config'

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
      changeFrequency: 'yearly',
      priority: 1
    }
  ]
}
