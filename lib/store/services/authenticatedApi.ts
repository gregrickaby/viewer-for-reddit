import type {SortingOption, SubredditItem} from '@/lib/types'
import type {components} from '@/lib/types/reddit-api'
import {MAX_LIMIT} from '@/lib/utils/api/apiConstants'
import {authenticatedBaseQuery} from '@/lib/utils/api/baseQuery/authenticatedBaseQuery'
import {createApi} from '@reduxjs/toolkit/query/react'

// Auto-generated types for custom feed posts
type AutoSubredditPostsResponse =
  components['schemas']['GetSubredditPostsResponse']

/**
 * Custom Feed type definition
 */
export interface CustomFeed {
  name: string
  display_name: string
  path: string
  icon_url: string
  subreddits: string[]
}

/**
 * Query parameters for fetching custom feed posts.
 */
export interface CustomFeedPostsArgs {
  username: string
  customFeedName: string
  sort: SortingOption
}

/**
 * Authenticated API service using RTK Query.
 *
 * Handles user-authenticated Reddit API requests including:
 * - User subscriptions
 * - User custom feeds (list and posts)
 * - Home feed
 * - Voting (future)
 * - Saved posts (future)
 *
 * All endpoints use user session tokens, not app-level tokens.
 * This provides access to user-specific and private content.
 *
 * Features:
 * - Automatic caching with invalidation
 * - Loading and error states
 * - Graceful degradation when not authenticated
 * - Type-safe responses
 * - Infinite pagination support
 *
 * @see {@link https://redux-toolkit.js.org/rtk-query/overview} RTK Query Documentation
 */
export const authenticatedApi = createApi({
  reducerPath: 'authenticatedApi',
  tagTypes: ['UserSubscriptions', 'UserCustomFeeds', 'CustomFeedPosts'],
  baseQuery: authenticatedBaseQuery,
  endpoints: (builder) => ({
    /**
     * Fetches the authenticated user's subscribed subreddits.
     *
     * Returns an empty array if the user is not authenticated, enabling
     * graceful degradation of UI features.
     *
     * @returns {SubredditItem[]} Array of subscribed subreddits
     *
     * @example
     * const {data, isLoading} = useGetUserSubscriptionsQuery()
     */
    getUserSubscriptions: builder.query<SubredditItem[], void>({
      query: () => '/subreddits/mine/subscriber?limit=100',
      transformResponse: (response: any) => {
        // Handle empty response for unauthenticated users
        if (!response?.data?.children) {
          return []
        }

        // Transform to match SubredditItem format
        return response.data.children.map((child: any) => ({
          display_name: child.data.display_name,
          icon_img: child.data.icon_img || child.data.community_icon || '',
          value: child.data.display_name,
          over18: child.data.over18 || false,
          subscribers: child.data.subscribers || 0
        }))
      },
      providesTags: ['UserSubscriptions']
    }),

    /**
     * Fetches the authenticated user's custom feeds.
     *
     * Returns an empty array if the user is not authenticated, enabling
     * graceful degradation of UI features.
     *
     * @returns {CustomFeed[]} Array of user's custom feeds
     *
     * @example
     * const {data, isLoading} = useGetUserCustomFeedsQuery()
     */
    getUserCustomFeeds: builder.query<CustomFeed[], void>({
      query: () => '/api/multi/mine.json',
      transformResponse: (response: any) => {
        // Handle empty/invalid response
        if (!Array.isArray(response)) {
          return []
        }

        // Reddit's /api/multi/mine.json returns an array directly
        return response.map((item: any) => {
          // Reddit returns path like "/user/username/m/customFeedName/"
          // Remove trailing slash for consistency with Next.js routing
          const path = item.data?.path?.replace(/\/$/, '') || ''

          return {
            name: item.data?.name || '',
            display_name: item.data?.display_name || item.data?.name || '',
            path,
            icon_url: item.data?.icon_url || '',
            subreddits: item.data?.subreddits?.map((sub: any) => sub.name) || []
          }
        })
      },
      providesTags: ['UserCustomFeeds']
    }),

    /**
     * Fetches posts from a user's custom feed with infinite scroll support.
     *
     * This endpoint requires user authentication and uses the user's session
     * token to access their private custom feeds.
     *
     * @param {CustomFeedPostsArgs} args - Query arguments
     * @param {string} args.username - Reddit username who owns the custom feed
     * @param {string} args.customFeedName - Name of the custom feed
     * @param {SortingOption} args.sort - Sort method (hot, new, top, rising, etc.)
     * @param {string} [pageParam] - Pagination cursor for next page
     *
     * @returns {AutoSubredditPostsResponse} Posts response with pagination
     *
     * @example
     * const {data, fetchNextPage} = useGetCustomFeedPostsInfiniteQuery({
     *   username: 'abc123',
     *   customFeedName: 'one',
     *   sort: 'hot'
     * })
     */
    getCustomFeedPosts: builder.infiniteQuery<
      AutoSubredditPostsResponse,
      CustomFeedPostsArgs,
      string | undefined
    >({
      infiniteQueryOptions: {
        initialPageParam: undefined,
        getNextPageParam: (lastPage) => lastPage?.data?.after ?? undefined,
        getPreviousPageParam: () => undefined,
        maxPages: 10
      },
      query({queryArg: {username, customFeedName, sort}, pageParam}) {
        const params = new URLSearchParams({limit: String(MAX_LIMIT)})
        if (pageParam) params.set('after', pageParam)

        // Build custom feed path: /user/{username}/m/{customFeedName}/{sort}.json
        return `/user/${username}/m/${customFeedName}/${sort}.json?${params.toString()}`
      },
      transformResponse: (
        response: AutoSubredditPostsResponse
      ): AutoSubredditPostsResponse => ({
        ...response,
        data: {
          ...response.data,
          // Filter out stickied posts
          children: response.data?.children?.filter(
            (child) => !child.data?.stickied
          )
        }
      }),
      providesTags: ['CustomFeedPosts']
    })
  })
})

/**
 * Exported RTK Query hooks for authenticated API endpoints.
 */
export const {
  useGetUserSubscriptionsQuery,
  useGetUserCustomFeedsQuery,
  useGetCustomFeedPostsInfiniteQuery
} = authenticatedApi
