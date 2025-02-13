import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { v4 as uuidv4 } from 'uuid'
import type { RedditSearchResponse, RedditSubreddit } from '../../types/reddit'

/**
 * Private Reddit API service.
 *
 * This service requires an authenticated user to access protected endpoints.
 */
export const privateApi = createApi({
  reducerPath: 'privateApi',
  tagTypes: ['Search'],
  baseQuery: fetchBaseQuery({
    baseUrl: '/api',
    prepareHeaders: (headers) => {
      headers.set('x-api-key', import.meta.env.VITE_API_KEY || '')
      return headers
    }
  }),
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
        url: '/search',
        params: {
          query: encodeURIComponent(query.trim()),
          include_over_18: enableNsfw,
          include_profiles: false,
          limit: 10,
          search_query_id: uuidv4(),
          typeahead_active: true
        }
      }),

      // Cache for 5 minutes.
      keepUnusedDataFor: 300,

      // Create a unique cache key for each search
      serializeQueryArgs: ({ queryArgs }) =>
        `${queryArgs.query}-${queryArgs.enableNsfw}`,

      // Merge function for updating existing cache.
      merge: (currentCache, newItems) => {
        if (!currentCache) return newItems
        return Array.from(new Set([...currentCache, ...newItems]))
      },

      // Only refetch if the query or NSFW setting changes.
      forceRefetch: ({ currentArg, previousArg }) =>
        currentArg?.query !== previousArg?.query ||
        currentArg?.enableNsfw !== previousArg?.enableNsfw,

      // Transform and sort results.
      transformResponse: (response: RedditSearchResponse) =>
        response.data.children
          .map((child) => child.data)
          .sort((a, b) => b.subscribers - a.subscribers),

      // Add tags for cache invalidation.
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Search' as const, id })),
              { type: 'Search', id: 'LIST' }
            ]
          : [{ type: 'Search', id: 'LIST' }]
    })
  })
})

// Export hooks for usage in functional components.
export const { useSearchSubredditsQuery } = privateApi
