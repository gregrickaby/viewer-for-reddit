import type {SubredditItem} from '@/lib/types'
import type {components} from '@/lib/types/reddit-api'
import {MIN_LIMIT} from '@/lib/utils/api/apiConstants'
import {baseQuery} from '@/lib/utils/api/baseQuery/baseQuery'
import {fromSearch} from '@/lib/utils/formatting/subredditMapper'
import {createApi} from '@reduxjs/toolkit/query/react'

/**
 * Auto-generated type aliases for search-related Reddit API responses.
 * These types are extracted from the OpenAPI schema and provide type safety
 * for search functionality while maintaining compatibility with existing code.
 */

type AutoSearchSubredditsResponse =
  components['schemas']['SearchSubredditsResponse']

/** Extracted data type for search subreddit children responses */
type AutoSearchChildData = NonNullable<
  NonNullable<
    NonNullable<
      components['schemas']['SearchSubredditsResponse']['data']
    >['children']
  >[number]['data']
>

/**
 * Search API service using RTK Query.
 *
 * Handles all search-related operations including subreddit search,
 * autocomplete functionality, and search result caching.
 *
 * @see {@link https://redux-toolkit.js.org/rtk-query/overview} RTK Query Documentation
 * @see {@link https://www.reddit.com/dev/api/} Reddit API Documentation
 */
export const searchApi = createApi({
  reducerPath: 'searchApi',
  tagTypes: ['Search'],
  baseQuery,
  endpoints: (builder) => ({
    /**
     * Search subreddits using Reddit's autocomplete API.
     *
     * Uses the subreddit_autocomplete_v2 endpoint which provides fast,
     * typeahead-style results optimized for search-as-you-type functionality.
     * Perfect for implementing search dropdowns and autocomplete features.
     *
     * Key features:
     * - Fast typeahead-optimized responses
     * - NSFW filtering support
     * - Excludes user profiles from results
     * - Normalized SubredditItem response format
     * - Per-query caching for performance
     *
     * @param {Object} params - Search parameters
     * @param {string} params.query - The search query string
     * @param {boolean} params.enableNsfw - Whether to include NSFW subreddits in results
     *
     * @returns {SubredditItem[]} Array of normalized subreddit items
     *
     * @example
     * // Search for programming-related subreddits
     * const {data, isLoading} = useSearchSubredditsQuery({
     *   query: 'programming',
     *   enableNsfw: false
     * })
     *
     * // Handle search results
     * if (data) {
     *   data.forEach(subreddit => {
     *     console.log(`${subreddit.display_name}: ${subreddit.subscribers} members`)
     *   })
     * }
     */
    searchSubreddits: builder.query<
      SubredditItem[],
      {query: string; enableNsfw: boolean}
    >({
      query: ({query, enableNsfw}) => {
        const params = new URLSearchParams({
          query,
          limit: String(MIN_LIMIT),
          include_over_18: String(enableNsfw),
          include_profiles: 'false', // Exclude user profiles from results
          typeahead_active: 'true' // Enable typeahead optimizations
        })
        return `/api/subreddit_autocomplete_v2?${params.toString()}`
      },
      transformResponse: (response: AutoSearchSubredditsResponse) => {
        // Extract children manually since auto-generated types don't match extractChildren generic
        const children = response.data?.children ?? []
        const childrenData = children
          .map((child) => child.data)
          .filter((data): data is AutoSearchChildData => data !== undefined)

        // Transform to normalized SubredditItem format using the search mapper
        return childrenData.map(fromSearch)
      },
      // Cache results per search query for performance
      providesTags: (_result, _err, {query}) => [{type: 'Search', id: query}]
    })
  })
})

/**
 * Exported RTK Query hooks for Search API endpoints.
 * @see {@link https://redux-toolkit.js.org/rtk-query/usage/queries} RTK Query Usage Guide
 */
export const {useSearchSubredditsQuery} = searchApi
