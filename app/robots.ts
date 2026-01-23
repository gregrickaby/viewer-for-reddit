import {appConfig} from '@/lib/config/app.config'
import {MetadataRoute} from 'next'

/**
 * The robots.txt route.
 *
 * Allows crawling of the homepage and about page.
 * Disallows crawling of ALL dynamic content to:
 * - Prevent excessive API usage from crawlers
 * - Avoid indexing duplicate Reddit content
 * - Prevent soft 404s from Reddit API rate limits
 * - Focus SEO on the main landing page
 *
 * IMPORTANT: Blocks entire /r/ path (not just specific comment pages)
 * to prevent Googlebot from discovering and crawling subreddits.
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/about', '/donate'],
        disallow: ['/r/', '/u/', '/user/', '/api/', '/search/'],
        crawlDelay: 2
      }
    ],
    sitemap: `${appConfig.site.baseUrl}/sitemap.xml`
  }
}
