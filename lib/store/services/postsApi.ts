import type {SortingOption, SubredditItem} from '@/lib/types'
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
 * @property {string} subreddit - Subreddit name or multi-subreddit string (e.g., "programming" or "gifs+aww+cats")
 * @property {SortingOption} sort - How to sort posts (hot, new, top, etc.)
 */
export interface SubredditPostsArgs {
  subreddit: string
  sort: SortingOption
}

/**
 * Posts API service using RTK Query.
 *
 * Handles all post and subreddit-related operations including subreddit posts,
 * popular subreddits, subreddit information, and individual post data.
 *
 * @see {@link https://redux-toolkit.js.org/rtk-query/overview} RTK Query Documentation
 * @see {@link https://www.reddit.com/dev/api/} Reddit API Documentation
 */
export const postsApi = createApi({
  reducerPath: 'postsApi',
  tagTypes: ['SubredditPosts', 'PopularSubreddits'],
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
      // Cache per subreddit and invalidate when posts are updated
      providesTags: (_result, _err, subreddit) => [
        {type: 'SubredditPosts', id: subreddit}
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
    }),

    /**
     * Fetches paginated posts from a specific subreddit with infinite scrolling support.
     *
     * Supports both single subreddits and multi-subreddit queries (e.g., "gifs+aww+cats").
     * Automatically filters out stickied posts and provides pagination cursors for
     * infinite scrolling functionality.
     *
     * Key features:
     * - Multi-subreddit support with proper URL encoding
     * - Infinite pagination with "after" cursors
     * - Automatic sticky post filtering
     * - Configurable sorting options
     *
     * @param {SubredditPostsArgs} args - Query arguments
     * @param {string} args.subreddit - Single subreddit or multi-subreddit string (e.g., "programming" or "gifs+aww")
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

        // Handle multi-subreddit syntax: encode individual subreddit names but preserve + separators.
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
      transformResponse: (response: any): AutoPostChildData => {
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
export const {
  useGetSubredditAboutQuery,
  useGetPopularSubredditsQuery,
  useGetSubredditPostsInfiniteQuery,
  useLazyGetSubredditAboutQuery,
  useGetSinglePostQuery
} = postsApi
