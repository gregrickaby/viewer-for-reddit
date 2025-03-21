import config from '@/lib/config'
import { MetadataRoute } from 'next'

/**
 * The robots.txt route.
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/'
    },
    sitemap: `${config.siteUrl}/sitemap.xml`
  }
}
