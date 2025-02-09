import { createApi } from '@reduxjs/toolkit/query/react'
import type {
  RedditResponse,
  RedditSearchResponse,
  RedditSubreddit
} from '../../types/reddit'
import { baseQueryWithAuth } from '../../utils/baseQueryWithAuth'

export const redditApi = createApi({
  reducerPath: 'redditApi',
  tagTypes: ['Posts', 'Subreddits', 'Auth'],
  baseQuery: baseQueryWithAuth,
  endpoints: (builder) => ({
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
        url: '/popular/',
        params: { after, raw_json: 1 }
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
    }),

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
        url: `/subreddit/`,
        params: { after, limit: 2, raw_json: 1, subreddit, sort }
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
export const {
  useGetPopularSubredditsQuery,
  useGetSubredditPostsQuery,
  useSearchSubredditsQuery
} = redditApi
