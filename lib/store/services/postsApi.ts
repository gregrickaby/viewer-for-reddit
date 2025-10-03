import type {SortingOption} from '@/lib/types'
import type {components} from '@/lib/types/reddit-api'
import {MAX_LIMIT} from '@/lib/utils/apiConstants'
import {dynamicBaseQuery} from '@/lib/utils/baseQuery/dynamicBaseQuery'
import {createApi} from '@reduxjs/toolkit/query/react'

/**
 * Auto-generated type aliases for gradual migration from hand-written types.
 * These types are extracted from the OpenAPI schema and provide type safety
 * for Reddit API responses while maintaining compatibility with existing code.
 */

// Auto-generated type aliases for gradual migration from hand-written types.
type AutoPostCommentsResponse = components['schemas']['GetPostCommentsResponse']

type AutoSubredditPostsResponse =
  components['schemas']['GetSubredditPostsResponse']

/** Post child type for subreddit posts responses */
export type AutoPostChild = NonNullable<
  NonNullable<
    components['schemas']['GetSubredditPostsResponse']['data']
  >['children']
>[number]

/** Post child data type containing post metadata and content */
export type AutoPostChildData = NonNullable<AutoPostChild['data']>

/** Post type that includes media preview and hint information */
export type AutoPostWithMedia = Extract<
  AutoPostChildData,
  {preview?: any; post_hint?: string}
>

/**
 * Query parameters for fetching subreddit posts.
 *
 * @interface SubredditPostsArgs
 * @property {string} subreddit - Subreddit name or custom feeds string (e.g., "programming" or "gifs+aww+cats")
 * @property {SortingOption} sort - How to sort posts (hot, new, top, etc.)
 */
export interface SubredditPostsArgs {
  subreddit: string
  sort: SortingOption
}

/**
 * Posts API service using RTK Query.
 *
 * Handles all post-related operations including subreddit posts and individual post data.
 *
 * @see {@link https://redux-toolkit.js.org/rtk-query/overview} RTK Query Documentation
 * @see {@link https://www.reddit.com/dev/api/} Reddit API Documentation
 */
export const postsApi = createApi({
  reducerPath: 'postsApi',
  tagTypes: ['SubredditPosts'],
  baseQuery: dynamicBaseQuery,
  endpoints: (builder) => ({
    /**
     * Fetches paginated posts from a specific subreddit with infinite scrolling support.
     *
     * Supports both single subreddits and custom feeds queries (e.g., "gifs+aww+cats").
     * Automatically filters out stickied posts and provides pagination cursors for
     * infinite scrolling functionality.
     *
     * Key features:
     * - custom feeds support with proper URL encoding
     * - Infinite pagination with "after" cursors
     * - Automatic sticky post filtering
     * - Configurable sorting options
     *
     * @param {SubredditPostsArgs} args - Query arguments
     * @param {string} args.subreddit - Single subreddit or custom feeds string (e.g., "programming" or "gifs+aww")
     * @param {SortingOption} args.sort - Sort method (hot, new, top, rising, etc.)
     * @param {string} [pageParam] - Pagination cursor for next page (Reddit's "after" parameter)
     *
     * @returns {AutoSubredditPostsResponse} Posts response with filtered stickied posts
     *
     * @example
     * // Fetch hot posts from multiple subreddits
     * const {data, fetchNextPage} = useGetSubredditPostsInfiniteQuery({
     *   subreddit: 'programming+webdev+javascript',
     *   sort: 'hot'
     * })
     */
    getSubredditPosts: builder.infiniteQuery<
      AutoSubredditPostsResponse,
      SubredditPostsArgs,
      string | undefined
    >({
      infiniteQueryOptions: {
        initialPageParam: undefined,
        // Extract "after" cursor for next page pagination
        getNextPageParam: (lastPage) => lastPage?.data?.after ?? undefined,
        getPreviousPageParam: () => undefined, // Reddit doesn't support backward pagination
        maxPages: 10 // Limit memory usage for infinite scroll
      },
      query({queryArg: {subreddit, sort}, pageParam}) {
        const params = new URLSearchParams({limit: String(MAX_LIMIT)})
        if (pageParam) params.set('after', pageParam) // Add pagination cursor

        // Handle regular subreddit or custom feeds syntax (e.g., "gifs+aww+cats")
        // Encode individual subreddit names but preserve + separators
        const encodedSubreddit = subreddit
          .split('+')
          .map((sub) => encodeURIComponent(sub))
          .join('+')
        return `/r/${encodedSubreddit}/${sort}.json?${params.toString()}`
      },
      transformResponse: (
        response: AutoSubredditPostsResponse
      ): AutoSubredditPostsResponse => ({
        ...response,
        data: {
          ...response.data,
          // Filter out stickied posts (pinned posts) for cleaner feed experience.
          children: (response.data?.children ?? []).filter(
            (child) => child?.data && !child.data.stickied
          )
        }
      }),
      providesTags: (_result, _err, {subreddit}) => [
        {type: 'SubredditPosts', id: subreddit}
      ]
    }),

    /**
     * Fetches a single Reddit post data (without comments).
     *
     * Retrieves post data from Reddit's permalink endpoint.
     * For comments, use the separate comments API.
     *
     * @param {Object} params - Query parameters
     * @param {string} params.subreddit - The subreddit name (e.g., "programming")
     * @param {string} params.postId - The Reddit post ID (e.g., "abc123")
     *
     * @returns {AutoPostChildData} The post data with all metadata
     *
     * @example
     * // Fetch a single post
     * const {data, isLoading} = useGetSinglePostQuery({
     *   subreddit: 'programming',
     *   postId: 'abc123'
     * })
     */
    getSinglePost: builder.query<
      AutoPostChildData,
      {subreddit: string; postId: string}
    >({
      query: ({subreddit, postId}) => {
        const params = new URLSearchParams({limit: '1'})
        const encodedSubreddit = encodeURIComponent(subreddit)
        const encodedPostId = encodeURIComponent(postId)
        return `/r/${encodedSubreddit}/comments/${encodedPostId}.json?${params.toString()}`
      },
      transformResponse: (
        response: AutoPostCommentsResponse
      ): AutoPostChildData => {
        // Reddit returns [postListing, commentsListing] array for single post requests
        if (!Array.isArray(response) || response.length === 0) {
          throw new Error('Invalid single post response format')
        }

        const [postListing] = response

        // Extract post data from first listing
        const postChildren = postListing?.data?.children ?? []
        if (postChildren.length === 0) {
          throw new Error('Post not found')
        }
        const post = postChildren[0].data as AutoPostChildData
        if (!post) {
          throw new Error('Post data is missing')
        }

        return post
      },
      // Cache by subreddit and post ID combination
      providesTags: (_result, _err, {subreddit, postId}) => [
        {type: 'SubredditPosts', id: `${subreddit}:${postId}`}
      ]
    })
  })
})

/**
 * Exported RTK Query hooks for Posts API endpoints.
 * @see {@link https://redux-toolkit.js.org/rtk-query/usage/queries} RTK Query Usage Guide
 */
export const {useGetSubredditPostsInfiniteQuery, useGetSinglePostQuery} =
  postsApi
