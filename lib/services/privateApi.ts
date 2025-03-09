import { fetchSearchResults } from '@/lib/actions'
import type { RedditSubreddit } from '@/types/reddit'
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

/**
 * Private Reddit API service.
 *
 * This service now uses server actions directly instead of API routes.
 */
export const privateApi = createApi({
  reducerPath: 'privateApi',
  tagTypes: ['Search'],
  baseQuery: fetchBaseQuery({
    baseUrl: '/'
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
      queryFn: async ({ query }) => {
        try {
          // Use the fetchSearchResults server action directly
          const response = await fetchSearchResults(
            encodeURIComponent(query.trim())
          )

          // Transform response to match expected return format
          const data = response.data.children
            .map((child) => child.data)
            .sort((a, b) => b.subscribers - a.subscribers)

          return { data }
        } catch (error) {
          return {
            error: {
              status: 'CUSTOM_ERROR',
              data:
                error instanceof Error
                  ? error.message
                  : 'Failed to fetch search results',
              error: 'An error occurred while fetching search results'
            }
          }
        }
      },

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
