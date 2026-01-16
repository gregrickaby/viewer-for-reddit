import {appConfig} from '@/lib/config/app.config'
import {MetadataRoute} from 'next'

/**
 * The robots.txt route.
 *
 * Allows crawling of the homepage and about page.
 * Disallows crawling of user profiles and individual post pages to:
 * - Prevent excessive API usage from crawlers
 * - Avoid indexing duplicate Reddit content
 * - Focus SEO on the main landing page
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/u/', '/r/*/comments/', '/user/', '/api/', '/search/'],
        crawlDelay: 2
      }
    ],
    sitemap: `${appConfig.site.baseUrl}/sitemap.xml`
  }
}
