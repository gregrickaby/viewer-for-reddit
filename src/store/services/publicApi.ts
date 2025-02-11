import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { RedditResponse, RedditSearchResponse } from '../../types/reddit'

/**
 * Public Reddit API service.
 *
 * This service provides public access to Reddit API endpoints.
 */
export const publicApi = createApi({
  reducerPath: 'publicApi',
  tagTypes: ['Posts', 'Subreddits'],
  baseQuery: fetchBaseQuery({ baseUrl: 'https://www.reddit.com' }),
  endpoints: (builder) => ({
    /**
     * Fetch posts from a subreddit.
     *
     * @param subreddit - The subreddit name.
     * @param sort - The sort type (hot, new, top, etc).
     * @param after - The last post name from the previous page.
     * @returns The response object.
     */
    getSubredditPosts: builder.query<
      RedditResponse,
      { subreddit: string; sort: string; after?: string }
    >({
      query: ({ subreddit, sort, after }) => ({
        url: `/r/${subreddit}/${sort}.json`,
        params: { after, limit: 25, raw_json: 1 }
      }),

      // Filter out stickied posts.
      transformResponse: (response: RedditResponse) => ({
        ...response,
        data: {
          ...response.data,
          children: response.data.children.filter(({ data }) => !data.stickied)
        }
      }),

      // Serialize the query args to use them as a cache key.
      serializeQueryArgs: ({ queryArgs }) =>
        `${queryArgs.subreddit}-${queryArgs.sort}`,

      // Merge the new items with the existing cache for infinite scroll.
      merge: (currentCache, newItems) => {
        if (!currentCache) return newItems
        return {
          ...currentCache,
          data: {
            ...newItems.data,
            children: [...currentCache.data.children, ...newItems.data.children]
          }
        }
      },

      // Refetch the data when the `subreddit`, `sort`, or `after` args change.
      forceRefetch: ({ currentArg, previousArg }) =>
        currentArg?.subreddit !== previousArg?.subreddit ||
        currentArg?.sort !== previousArg?.sort ||
        currentArg?.after !== previousArg?.after,

      // Provide tags for invalidating the cache.
      providesTags: ['Posts']
    }),

    /**
     * Fetch popular subreddits.
     *
     * @param after - The last subreddit name from the previous page.
     * @returns The response object.
     */
    getPopularSubreddits: builder.query<
      RedditSearchResponse,
      { after?: string }
    >({
      query: ({ after }) => ({
        url: '/subreddits/popular.json',
        params: { after, limit: 25, raw_json: 1 }
      }),

      // Sort subreddits by subscribers count.
      transformResponse: (response: RedditSearchResponse) => ({
        ...response,
        data: {
          ...response.data,
          children: response.data.children.sort(
            (a, b) => b.data.subscribers - a.data.subscribers
          )
        }
      }),

      // Serialize the query args to use them as a cache key.
      serializeQueryArgs: ({ queryArgs }) => `popular-${queryArgs.after || ''}`,

      // Merge the new items with the existing cache for infinite scroll.
      merge: (currentCache, newItems, { arg }) => {
        if (!currentCache) return newItems
        if (!arg.after) return newItems
        return {
          ...newItems,
          data: {
            ...newItems.data,
            children: [...currentCache.data.children, ...newItems.data.children]
          }
        }
      },

      // Refetch the data when the `after` arg changes.
      forceRefetch: ({ currentArg, previousArg }) =>
        currentArg?.after !== previousArg?.after,

      // Provide tags for invalidating the cache.
      providesTags: ['Subreddits']
    })
  })
})

// Export hooks for usage in functional components.
export const { useGetPopularSubredditsQuery, useGetSubredditPostsQuery } =
  publicApi
