import config from '@/lib/config'
import {MetadataRoute} from 'next'

/**
 * Revalidate every 12 hours.
 */
export const revalidate = 43200

/**
 * Top subreddits from getPopularSubreddits({ limit: 25 })
 */
const popularSubreddits = [
  'funny',
  'AskReddit',
  'gaming',
  'worldnews',
  'movies',
  'pics',
  'news',
  'AmItheAsshole',
  'Damnthatsinteresting',
  'pcmasterrace',
  'interestingasfuck',
  'Unexpected',
  'mildlyinfuriating',
  'politics',
  'leagueoflegends',
  'facepalm',
  'NoStupidQuestions',
  'AITAH',
  'LivestreamFail',
  'BaldursGate3',
  'Piracy',
  'PeterExplainsTheJoke',
  'Helldivers',
  'Palworld',
  'Home'
]

/**
 * Sitemap generator.
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = config.siteUrl
  const lastModified = new Date()

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: base,
      lastModified,
      changeFrequency: 'daily',
      priority: 1
    },
    {
      url: `${base}about`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.5
    }
  ]

  const subredditPages: MetadataRoute.Sitemap = popularSubreddits.map(
    (slug) => ({
      url: `${base}r/${slug}`,
      lastModified,
      changeFrequency: 'hourly',
      priority: 0.8
    })
  )

  return [...staticPages, ...subredditPages]
}
