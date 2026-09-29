/*
 * What to capture for type generation and the media corpus (docs/implementation.md §2.2).
 * Breadth matters: quicktype infers optional fields and unions only from what the samples
 * contain, so we deliberately sample every media shape, listing kind, and envelope.
 */

export type Capture = {
  /** Output file: fixtures/reddit/raw/<name>.json */
  name: string
  path: string
  query?: Record<string, string | number>
}

const MEDIA_SUBREDDITS = [
  'pics',
  'videos',
  'gifs',
  'reactiongifs',
  'HighQualityGifs',
  'youtubehaiku',
  'LivestreamFail',
  'interestingasfuck',
  'oddlysatisfying',
  'mildlyinteresting',
  'itookapicture',
  'CozyPlaces',
  'battlestations',
  'spotify',
  'imgur',
  'nextjs',
]

/** Provider samples via search: no subreddit lists, no configuration (docs/design.md §8.7). */
const PROVIDER_SITES = [
  'redgifs.com',
  'giphy.com',
  'imgur.com',
  'streamable.com',
  'youtube.com',
  'youtu.be',
  'vimeo.com',
  'clips.twitch.tv',
  'tiktok.com',
  'open.spotify.com',
  'soundcloud.com',
]

export function captures(username: string): Capture[] {
  return [
    { name: 'me', path: '/api/v1/me' },
    { name: 'home-best', path: '/best', query: { limit: 100 } },
    { name: 'home-new', path: '/new', query: { limit: 100 } },
    { name: 'all-top-day', path: '/r/all/top', query: { t: 'day', limit: 100 } },
    { name: 'popular-hot', path: '/r/popular/hot', query: { limit: 100 } },
    { name: 'askreddit-top-week', path: '/r/AskReddit/top', query: { t: 'week', limit: 50 } },
    { name: 'eli5-top-month', path: '/r/explainlikeimfive/top', query: { t: 'month', limit: 50 } },
    ...MEDIA_SUBREDDITS.map((sr) => ({
      name: `media-${sr.toLowerCase()}`,
      path: `/r/${sr}/top`,
      query: { t: 'week', limit: 100 },
    })),
    ...PROVIDER_SITES.map((site) => ({
      name: `site-${site}`,
      path: '/search',
      query: {
        q: `site:${site}`,
        include_over_18: 'on',
        sort: 'top',
        t: 'month',
        type: 'link',
        limit: 100,
      },
    })),
    { name: 'sub-about-pics', path: '/r/pics/about' },
    { name: 'sub-about-askreddit', path: '/r/AskReddit/about' },
    { name: 'subs-mine', path: '/subreddits/mine/subscriber', query: { limit: 100 } },
    { name: 'multis-mine', path: '/api/multi/mine', query: { expand_srs: 'true' } },
    { name: 'saved', path: `/user/${username}/saved`, query: { limit: 100 } },
    { name: 'user-about-spez', path: '/user/spez/about' },
    { name: 'user-overview-spez', path: '/user/spez/overview', query: { limit: 100 } },
    {
      name: 'search-subreddits',
      path: '/subreddits/search',
      query: { q: 'programming', limit: 50 },
    },
  ]
}

/** Listings whose top posts also get their comment threads captured. */
export const THREAD_SOURCES = ['all-top-day', 'askreddit-top-week', 'media-pics', 'media-gifs']
export const THREADS_PER_SOURCE = 5
