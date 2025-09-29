import type {SubredditItem} from '@/lib/types'
import type {components} from '@/lib/types/reddit-api'
import {MAX_LIMIT} from '@/lib/utils/apiConstants'
import {baseQuery} from '@/lib/utils/baseQuery/baseQuery'
import {fromAbout, fromPopular} from '@/lib/utils/subredditMapper'
import {createApi} from '@reduxjs/toolkit/query/react'

/**
 * Auto-generated type aliases for gradual migration from hand-written types.
 * These types are extracted from the OpenAPI schema and provide type safety
 * for Reddit API responses while maintaining compatibility with existing code.
 */

// Auto-generated type aliases for gradual migration from hand-written types.
type AutoSubredditAboutResponse =
  components['schemas']['GetSubredditAboutResponse']
type AutoPopularSubredditsResponse =
  components['schemas']['GetPopularSubredditsResponse']

/** Extracted data type for popular subreddit children responses */
type AutoPopularChildData = NonNullable<
  NonNullable<
    NonNullable<
      components['schemas']['GetPopularSubredditsResponse']['data']
    >['children']
  >[number]['data']
>

/**
 * Subreddit API service using RTK Query.
 *
 * Handles subreddit discovery and metadata operations including subreddit information
 * and popular subreddit listings.
 *
 * @see {@link https://redux-toolkit.js.org/rtk-query/overview} RTK Query Documentation
 * @see {@link https://www.reddit.com/dev/api/} Reddit API Documentation
 */
export const subredditApi = createApi({
  reducerPath: 'subredditApi',
  tagTypes: ['SubredditAbout', 'PopularSubreddits'],
  baseQuery,
  endpoints: (builder) => ({
    /**
     * Fetches detailed information about a specific subreddit.
     *
     * Retrieves subreddit metadata including description, subscriber count,
     * rules, and other community information from the /about.json endpoint.
     *
     * @param {string} subreddit - The subreddit name (e.g., "programming", "gifs")
     *
     * @returns {SubredditItem} Normalized subreddit information
     *
     * @example
     * // Get information about the programming subreddit
     * const {data} = useGetSubredditAboutQuery('programming')
     */
    getSubredditAbout: builder.query<SubredditItem, string>({
      query: (subreddit) => `/r/${encodeURIComponent(subreddit)}/about.json`,
      transformResponse: (response: AutoSubredditAboutResponse) =>
        fromAbout(response.data!), // Transform to normalized format
      // Cache per subreddit
      providesTags: (_result, _err, subreddit) => [
        {type: 'SubredditAbout', id: subreddit}
      ]
    }),

    /**
     * Fetches and sorts popular subreddits by subscriber count.
     *
     * Retrieves trending subreddits from Reddit's /subreddits/popular.json endpoint
     * and sorts them by subscriber count in descending order. Useful for discovering
     * active communities and populating recommendation lists.
     *
     * @param {Object} params - Query parameters
     * @param {number} [params.limit=25] - Number of subreddits to retrieve (max 25)
     *
     * @returns {SubredditItem[]} Array of popular subreddits sorted by subscriber count
     *
     * @example
     * // Get top 10 popular subreddits
     * const {data} = useGetPopularSubredditsQuery({limit: 10})
     */
    getPopularSubreddits: builder.query<SubredditItem[], {limit?: number}>({
      query: ({limit = MAX_LIMIT}) => {
        const params = new URLSearchParams({limit: String(limit)})
        return `/subreddits/popular.json?${params.toString()}`
      },
      transformResponse: (response: AutoPopularSubredditsResponse) => {
        // Extract children using type assertion since the structures are compatible at runtime
        const children = response.data?.children ?? []
        const childrenData = children
          .map((child) => child.data)
          .filter((data): data is AutoPopularChildData => data !== undefined)

        // Sort by subscriber count (highest first) for better relevance
        const sortedChildren = [...childrenData].sort(
          (a, b) => (b.subscribers ?? 0) - (a.subscribers ?? 0)
        )

        // Transform to normalized SubredditItem format
        return sortedChildren.map(fromPopular)
      },
      // Provide granular cache tags for each subreddit result
      providesTags: (result) =>
        result?.length
          ? result.map((sub) => ({
              type: 'PopularSubreddits' as const,
              id: sub.display_name
            }))
          : [{type: 'PopularSubreddits' as const}]
    })
  })
})

/**
 * Exported RTK Query hooks for Subreddit API endpoints.
 * @see {@link https://redux-toolkit.js.org/rtk-query/usage/queries} RTK Query Usage Guide
 */
export const {
  useGetSubredditAboutQuery,
  useGetPopularSubredditsQuery,
  useLazyGetSubredditAboutQuery
} = subredditApi
