import { createApi } from '@reduxjs/toolkit/query/react'
import type { RedditSearchResponse, RedditSubreddit } from '../../types/reddit'
import { baseQueryWithAuth } from '../../utils/baseQueryWithAuth'

/**
 * Private Reddit API service.
 *
 * This service requires an authenticated user to access protected endpoints.
 */
export const privateApi = createApi({
  reducerPath: 'privateApi',
  tagTypes: ['Search'],
  baseQuery: baseQueryWithAuth,
  endpoints: (builder) => ({
    /**
     * Search subreddits.
     *
     * @param query - The search query.
     * @param enableNsfw - Whether to include NSFW subreddits.
     * @returns The response object.
     */
    searchSubreddits: builder.query<
      RedditSubreddit[],
      { query: string; enableNsfw: boolean }
    >({
      query: ({ query, enableNsfw }) => ({
        url: '/search/',
        params: {
          query: encodeURIComponent(query.trim()),
          include_over_18: enableNsfw,
          include_profiles: false,
          typeahead_active: false,
          search_query_id: 'DO_NOT_TRACK'
        }
      }),

      // Sort subreddits by subscribers count.
      transformResponse: (response: RedditSearchResponse) =>
        response.data.children
          .map((child) => child.data)
          .sort((a, b) => b.subscribers - a.subscribers)
    })
  })
})

// Export hooks for usage in functional components.
export const { useSearchSubredditsQuery } = privateApi
