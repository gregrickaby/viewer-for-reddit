import type {components} from '@/lib/types/reddit-api'
import {COMMENTS_LIMIT, MAX_LIMIT} from '@/lib/utils/apiConstants'
import {dynamicBaseQuery} from '@/lib/utils/baseQuery/dynamicBaseQuery'
import {extractAndFilterComments} from '@/lib/utils/commentFilters'
import {createApi} from '@reduxjs/toolkit/query/react'

/**
 * Auto-generated type aliases for comment-related responses.
 * These types are extracted from the OpenAPI schema and provide type safety
 * for Reddit API comment responses while maintaining compatibility with existing code.
 */

// Auto-generated type aliases for comment-related responses
type AutoPostCommentsResponse = components['schemas']['GetPostCommentsResponse']

// User-related auto-generated types
// The OpenAPI schema in this repo does not include dedicated user comments
// response shapes named `GetUserCommentsResponse`.
// Reuse compatible generated types to keep typings accurate and avoid hard
// failures when the OpenAPI spec is narrower than runtime responses.
// The generated GetPostCommentsResponse is an array (post listing + comments
// listing). For user comments we want a single listing element that contains
// a `.data` property. Use the element type of the post comments response.
type AutoUserCommentsResponse = AutoPostCommentsResponse[number]

/** Extracted data type for user comments responses */
export type AutoUserCommentChild = NonNullable<
  NonNullable<AutoUserCommentsResponse['data']>['children']
>[number]

/** User comment child data type */
export type AutoUserCommentData = NonNullable<AutoUserCommentChild['data']>

/** Comments listing type extracted from post comments responses */
type CommentsListing = Extract<
  AutoPostCommentsResponse[number],
  {data?: {children?: any}}
>

/** Individual comment child type from comments listing */
export type AutoCommentChild = NonNullable<
  NonNullable<NonNullable<CommentsListing['data']>['children']>[number]
>

/** Comment data type containing comment text and metadata */
export type AutoCommentData = NonNullable<AutoCommentChild['data']>

/** Comment type that includes body text content */
export type AutoCommentWithText = Extract<
  AutoCommentData,
  {body?: string; body_html?: string}
>

/**
 * Comments API service using RTK Query.
 *
 * Handles all comment-related Reddit API endpoints including post comments
 * and user comment history with infinite pagination support.
 *
 * @see {@link https://redux-toolkit.js.org/rtk-query/overview} RTK Query Documentation
 * @see {@link https://www.reddit.com/dev/api/} Reddit API Documentation
 */
export const commentsApi = createApi({
  reducerPath: 'commentsApi',
  tagTypes: ['PostComments', 'UserComments'],
  baseQuery: dynamicBaseQuery,
  endpoints: (builder) => ({
    /**
     * Fetches comments for a specific Reddit post with infinite pagination support.
     *
     * Retrieves and processes comments from a post's permalink using infinite scrolling.
     * This is the preferred method for loading comments as it provides better performance
     * and user experience compared to loading all comments at once.
     *
     * Key features:
     * - Infinite pagination with automatic next page detection
     * - Confidence-based sorting for best comments first
     * - Automatic AutoModerator comment filtering
     * - Memory-efficient with page limits
     * - Processes nested comment threads
     *
     * @param {string} permalink - The Reddit post permalink (e.g., "/r/programming/comments/abc123/title/")
     *
     * @returns {AutoPostCommentsResponse} Comments response with pagination support
     *
     * @example
     * // Fetch comments with infinite loading
     * const {data, fetchNextPage, hasNextPage} = useGetPostCommentsPagesInfiniteQuery('/r/programming/comments/abc123/title/')
     */
    getPostCommentsPages: builder.infiniteQuery<
      AutoPostCommentsResponse,
      string,
      string | undefined
    >({
      infiniteQueryOptions: {
        initialPageParam: undefined,
        getNextPageParam: (lastPage) => {
          // For comments, we need to check if there are more comments to load
          // Reddit comments API returns an array with [post, comments]
          const commentsListing = Array.isArray(lastPage)
            ? lastPage[1]
            : lastPage
          return commentsListing?.data?.after ?? undefined
        },
        getPreviousPageParam: () => undefined,
        maxPages: 20 // Allow more pages for comments than posts
      },
      query({queryArg: permalink, pageParam}) {
        const params = new URLSearchParams({
          limit: String(100), // Increase limit to get more comments
          sort: 'confidence', // Use confidence sorting for best comments first
          ...(pageParam && {after: pageParam})
        })
        return `${permalink}.json?${params.toString()}`
      },
      transformResponse: (response: AutoPostCommentsResponse) => response
    }),

    /**
     * Fetches raw comments for a specific Reddit post with infinite pagination support.
     *
     * Similar to getPostCommentsPages but preserves the complete nested structure
     * for nested comment rendering. Returns unprocessed Reddit API responses.
     *
     * @param {string} permalink - The Reddit post permalink
     * @returns {AutoPostCommentsResponse} Raw comments response with nested structure
     *
     * @example
     * // Fetch raw comments with infinite loading for nested rendering
     * const {data, fetchNextPage, hasNextPage} = useGetPostCommentsPagesRawInfiniteQuery('/r/programming/comments/abc123/title/')
     */
    getPostCommentsPagesRaw: builder.infiniteQuery<
      AutoPostCommentsResponse,
      string,
      string | undefined
    >({
      infiniteQueryOptions: {
        initialPageParam: undefined,
        getNextPageParam: (lastPage) => {
          const commentsListing = Array.isArray(lastPage)
            ? lastPage[1]
            : lastPage
          return commentsListing?.data?.after ?? undefined
        },
        getPreviousPageParam: () => undefined,
        maxPages: 20
      },
      query({queryArg: permalink, pageParam}) {
        const params = new URLSearchParams({
          limit: String(100),
          sort: 'confidence',
          ...(pageParam && {after: pageParam})
        })
        return `${permalink}.json?${params.toString()}`
      },
      transformResponse: (response: AutoPostCommentsResponse) => response
    }),

    /**
     * Fetches comments for a specific Reddit post (legacy single request).
     *
     * Retrieves and processes comments from a post's permalink, automatically filtering
     * out AutoModerator comments and handling Reddit's dual response format. The API
     * returns both post data and comments in a two-element array.
     *
     * Key features:
     * - Automatic AutoModerator comment filtering
     * - Handles both array and direct listing response formats
     * - Limits comments for performance (25 comments max)
     * - Processes nested comment threads
     *
     * @param {string} permalink - The Reddit post permalink (e.g., "/r/programming/comments/abc123/title/")
     *
     * @returns {AutoCommentData[]} Array of processed comment data, excluding AutoModerator
     *
     * @example
     * // Fetch comments for a specific post
     * const [trigger] = useLazyGetPostCommentsQuery()
     * trigger('/r/programming/comments/abc123/my_post/')
     */
    getPostComments: builder.query<AutoCommentData[], string>({
      // Build the API endpoint URL by appending .json to the permalink with a limit of comments
      query: (permalink) => {
        const params = new URLSearchParams({limit: String(COMMENTS_LIMIT)})
        return `${permalink}.json?${params.toString()}`
      },
      transformResponse: (response: AutoPostCommentsResponse) => {
        // Reddit API returns either a single CommentsListing or an array where:
        // - First element [0] is the post data (which we don't need here)
        // - Second element [1] is the comments listing
        const listing = Array.isArray(response)
          ? response[1] // Extract comments from array response
          : response // Use response directly if it's already a CommentsListing

        // Extract the children array from the listing data and apply filtering
        const children = listing?.data?.children ?? []

        // Apply comment filtering (removes AutoModerator, processes nested threads)
        return extractAndFilterComments(children)
      }
    }),

    /**
     * Fetches raw comments for a specific Reddit post preserving nested structure.
     *
     * This endpoint returns the unprocessed Reddit API response, preserving the nested
     * comment structure with replies objects intact. Use this for nested comment rendering.
     *
     * @param {string} permalink - The Reddit post permalink
     * @returns {AutoPostCommentsResponse} Raw Reddit API response with nested structure
     *
     * @example
     * // Fetch raw comments for nested rendering
     * const [trigger] = useLazyGetPostCommentsRawQuery()
     * trigger('/r/programming/comments/abc123/my_post/')
     */
    getPostCommentsRaw: builder.query<AutoPostCommentsResponse, string>({
      query: (permalink) => {
        const params = new URLSearchParams({limit: String(COMMENTS_LIMIT)})
        return `${permalink}.json?${params.toString()}`
      },
      transformResponse: (response: AutoPostCommentsResponse) => response
    }),

    /**
     * Fetches comments submitted by a specific user with infinite scrolling support.
     *
     * Retrieves paginated list of comments that a user has made across all subreddits.
     * Supports infinite pagination for smooth scrolling experience.
     *
     * @param {string} username - The Reddit username (without the u/ prefix)
     * @param {string} [pageParam] - Pagination cursor for next page
     *
     * @returns {AutoUserCommentsResponse} User's submitted comments with pagination info
     *
     * @example
     * // Fetch comments from a user with infinite scroll
     * const {data, fetchNextPage} = useGetUserCommentsInfiniteQuery('spez')
     */
    getUserComments: builder.infiniteQuery<
      AutoUserCommentsResponse,
      string,
      string | undefined
    >({
      infiniteQueryOptions: {
        initialPageParam: undefined,
        getNextPageParam: (lastPage) => lastPage?.data?.after ?? undefined,
        getPreviousPageParam: () => undefined,
        maxPages: 10 // Limit memory usage
      },
      query({queryArg: username, pageParam}) {
        const params = new URLSearchParams({limit: String(MAX_LIMIT)})
        if (pageParam) params.set('after', pageParam)
        return `/user/${username}/comments.json?${params.toString()}`
      },
      transformResponse: (
        response: AutoUserCommentsResponse
      ): AutoUserCommentsResponse => {
        // Return comments as-is, filtering can be done at component level if needed
        return response
      }
    })
  })
})

/**
 * Exported RTK Query hooks for Comments API endpoints.
 * @see {@link https://redux-toolkit.js.org/rtk-query/usage/queries} RTK Query Usage Guide
 */
export const {
  useGetPostCommentsPagesInfiniteQuery,
  useGetPostCommentsPagesRawInfiniteQuery,
  useLazyGetPostCommentsQuery,
  useLazyGetPostCommentsRawQuery,
  useGetUserCommentsInfiniteQuery
} = commentsApi
