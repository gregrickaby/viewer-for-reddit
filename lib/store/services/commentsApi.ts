import type {
  DeleteCommentRequest,
  DeleteCommentResponse,
  SubmitCommentRequest,
  SubmitCommentResponse
} from '@/lib/types'
import type {components} from '@/lib/types/reddit-api'
import {createRedditBaseQuery} from '@/lib/utils/api/baseQuery/createRedditBaseQuery'
import {dynamicBaseQuery} from '@/lib/utils/api/baseQuery/dynamicBaseQuery'
import {COMMENTS_LIMIT, MAX_LIMIT} from '@/lib/utils/api/config/apiConstants'
import {
  createCommentsInfiniteConfig,
  extractCommentsListing
} from '@/lib/utils/api/pagination/commentsPagination'
import {extractAndFilterComments} from '@/lib/utils/formatting/comments/commentFilters'
import {createApi} from '@reduxjs/toolkit/query/react'

/**
 * Base query for comment submission API.
 * Uses /api/reddit/comment endpoint for authenticated user comment submissions.
 */
const submitBaseQuery = createRedditBaseQuery('/api/reddit/comment')

/**
 * Base query for comment deletion API.
 * Uses /api/reddit/comment/delete endpoint for authenticated user comment deletions.
 */
const deleteBaseQuery = createRedditBaseQuery('/api/reddit/comment/delete')

/**
 * Type aliases for comment-related Reddit API responses.
 *
 * Note: Reddit's API returns GetPostCommentsResponse as an array [post, comments].
 * For user comments, we extract just the comments listing (array element type).
 */
type AutoPostCommentsResponse = components['schemas']['GetPostCommentsResponse']
type AutoUserCommentsResponse = AutoPostCommentsResponse[number]

/** Individual comment item from user's comment history */
export type AutoUserCommentChild = NonNullable<
  NonNullable<AutoUserCommentsResponse['data']>['children']
>[number]

/** Comment metadata and content from user's comment history */
export type AutoUserCommentData = NonNullable<AutoUserCommentChild['data']>

/** Comments listing extracted from post comments response */
type CommentsListing = Extract<
  AutoPostCommentsResponse[number],
  {data?: {children?: any}}
>

/** Individual comment from post comments listing */
export type AutoCommentChild = NonNullable<
  NonNullable<NonNullable<CommentsListing['data']>['children']>[number]
>

/** Comment data with text and metadata */
export type AutoCommentData = NonNullable<AutoCommentChild['data']>

/** Comment with body text content */
export type AutoCommentWithText = Extract<
  AutoCommentData,
  {body?: string; body_html?: string}
>

/**
 * RTK Query API for post comments, comment actions, and user comments.
 *
 * Uses dynamicBaseQuery to switch between anonymous and authenticated endpoints
 * based on user login state. This allows displaying vote states when authenticated.
 *
 * Handles:
 * - Fetching post comments with infinite scroll
 * - Fetching user comment history
 * - Submitting new comments and replies
 * - Deleting comments
 *
 * All mutations automatically invalidate relevant caches to ensure UI updates.
 *
 * @see {@link https://redux-toolkit.js.org/rtk-query/overview}
 */
export const commentsApi = createApi({
  reducerPath: 'commentsApi',
  baseQuery: dynamicBaseQuery,
  tagTypes: ['Comments', 'UserComments'],
  endpoints: (builder) => ({
    /**
     * Fetch post comments with infinite scroll pagination.
     *
     * @param permalink - Post permalink (e.g., "/r/programming/comments/abc123/title/")
     * @param pageParam - Pagination cursor (Reddit's "after" token)
     * @returns Comments with pagination info, sorted by confidence
     *
     * @example
     * const {data, fetchNextPage, hasNextPage} = useGetPostCommentsPagesInfiniteQuery('/r/programming/comments/abc123/title/')
     */
    getPostCommentsPages: builder.infiniteQuery<
      AutoPostCommentsResponse,
      string,
      string | undefined
    >({
      infiniteQueryOptions: createCommentsInfiniteConfig<CommentsListing>(20),
      query({queryArg: permalink, pageParam}) {
        const params = new URLSearchParams({
          limit: String(100),
          sort: 'confidence',
          ...(pageParam && {after: pageParam})
        })
        return `${permalink}.json?${params.toString()}`
      },
      transformResponse: (response: AutoPostCommentsResponse) => response,
      providesTags: ['Comments']
    }),

    /**
     * Fetch raw post comments with infinite scroll pagination.
     *
     * Returns unprocessed Reddit API response preserving nested structure.
     *
     * @param permalink - Post permalink
     * @param pageParam - Pagination cursor
     * @returns Raw comments response with nested replies
     *
     * @example
     * const {data, fetchNextPage} = useGetPostCommentsPagesRawInfiniteQuery('/r/programming/comments/abc123/title/')
     */
    getPostCommentsPagesRaw: builder.infiniteQuery<
      AutoPostCommentsResponse,
      string,
      string | undefined
    >({
      infiniteQueryOptions: createCommentsInfiniteConfig<CommentsListing>(20),
      query({queryArg: permalink, pageParam}) {
        const params = new URLSearchParams({
          limit: String(100),
          sort: 'confidence',
          ...(pageParam && {after: pageParam})
        })
        return `${permalink}.json?${params.toString()}`
      },
      transformResponse: (response: AutoPostCommentsResponse) => response,
      providesTags: ['Comments']
    }),

    /**
     * Fetch post comments (legacy single request).
     *
     * Filters out AutoModerator comments and processes nested threads.
     * Reddit API returns [post, comments] array - we extract comments listing.
     *
     * @param permalink - Post permalink
     * @returns Filtered comment data
     *
     * @example
     * const [trigger] = useLazyGetPostCommentsQuery()
     * trigger('/r/programming/comments/abc123/my_post/')
     */
    getPostComments: builder.query<AutoCommentData[], string>({
      query: (permalink) => {
        const params = new URLSearchParams({limit: String(COMMENTS_LIMIT)})
        return `${permalink}.json?${params.toString()}`
      },
      transformResponse: (response: AutoPostCommentsResponse) => {
        const listing = extractCommentsListing(response)
        const children = listing?.data?.children ?? []
        return extractAndFilterComments(children)
      },
      providesTags: ['Comments']
    }),

    /**
     * Fetch raw post comments preserving nested structure.
     *
     * Returns unprocessed Reddit API response with nested replies intact.
     *
     * @param permalink - Post permalink
     * @returns Raw comments response
     *
     * @example
     * const [trigger] = useLazyGetPostCommentsRawQuery()
     * trigger('/r/programming/comments/abc123/my_post/')
     */
    getPostCommentsRaw: builder.query<AutoPostCommentsResponse, string>({
      query: (permalink) => {
        const params = new URLSearchParams({limit: String(COMMENTS_LIMIT)})
        return `${permalink}.json?${params.toString()}`
      },
      transformResponse: (response: AutoPostCommentsResponse) => response,
      providesTags: ['Comments']
    }),

    /**
     * Fetch user's comment history with infinite scroll pagination.
     *
     * Uses anonymous baseQuery to prevent 403 errors when viewing public profiles.
     *
     * @param username - Reddit username without the u/ prefix
     * @param pageParam - Pagination cursor
     * @returns User's comments across all subreddits
     *
     * @example
     * const {data, fetchNextPage} = useGetUserCommentsInfiniteQuery('spez')
     */
    getUserComments: builder.infiniteQuery<
      AutoUserCommentsResponse,
      string,
      string | undefined
    >({
      infiniteQueryOptions:
        createCommentsInfiniteConfig<AutoUserCommentsResponse>(10),
      query({queryArg: username, pageParam}) {
        const params = new URLSearchParams({limit: String(MAX_LIMIT)})
        if (pageParam) params.set('after', pageParam)
        const encodedUsername = encodeURIComponent(username)
        return `/user/${encodedUsername}/comments.json?${params.toString()}`
      },
      transformResponse: (
        response: AutoUserCommentsResponse
      ): AutoUserCommentsResponse => {
        return response
      },
      providesTags: ['UserComments']
    }),

    /**
     * Submit a new comment or reply.
     *
     * Invalidates both Comments and UserComments caches to ensure
     * newly submitted comments appear in all relevant feeds.
     *
     * @param {SubmitCommentRequest} payload - Comment submission data
     * @param {string} payload.thing_id - Thing fullname (t1_xxx for comment, t3_xxx for post)
     * @param {string} payload.text - Raw markdown body
     *
     * @returns {SubmitCommentResponse} Submission result with comment data
     *
     * @example
     * // Reply to a comment
     * const [submitComment, {isLoading}] = useSubmitCommentMutation()
     * await submitComment({ thing_id: 't1_abc123', text: 'My reply' })
     *
     * @example
     * // Top-level comment on a post
     * await submitComment({ thing_id: 't3_xyz789', text: 'Great post!' })
     */
    submitComment: builder.mutation<
      SubmitCommentResponse,
      SubmitCommentRequest
    >({
      queryFn: async ({thing_id, text}, _api, _extraOptions, _baseQuery) => {
        const result = await submitBaseQuery(
          {
            url: '',
            method: 'POST',
            body: {thing_id, text}
          },
          _api,
          _extraOptions
        )

        if (result.error) {
          return {error: result.error}
        }

        return {data: result.data as SubmitCommentResponse}
      },
      invalidatesTags: ['Comments', 'UserComments']
    }),

    /**
     * Delete a comment.
     *
     * Invalidates both Comments and UserComments caches to ensure
     * deleted comments are removed from all relevant feeds.
     *
     * @param {DeleteCommentRequest} payload - Comment deletion data
     * @param {string} payload.id - Comment fullname (t1_xxx)
     *
     * @returns {DeleteCommentResponse} Deletion result
     *
     * @example
     * // Delete a comment
     * const [deleteComment, {isLoading}] = useDeleteCommentMutation()
     * await deleteComment({ id: 't1_abc123' })
     */
    deleteComment: builder.mutation<
      DeleteCommentResponse,
      DeleteCommentRequest
    >({
      queryFn: async ({id}, _api, _extraOptions, _baseQuery) => {
        const result = await deleteBaseQuery(
          {
            url: '',
            method: 'POST',
            body: {id}
          },
          _api,
          _extraOptions
        )

        if (result.error) {
          return {error: result.error}
        }

        return {data: result.data as DeleteCommentResponse}
      },
      invalidatesTags: ['Comments', 'UserComments']
    })
  })
})

/**
 * Auto-generated hooks for comments API.
 *
 * Includes queries for fetching comments and mutations for submitting/deleting.
 *
 * @see {@link https://redux-toolkit.js.org/rtk-query/usage/queries}
 */
export const {
  useGetPostCommentsPagesInfiniteQuery,
  useGetPostCommentsPagesRawInfiniteQuery,
  useLazyGetPostCommentsQuery,
  useLazyGetPostCommentsRawQuery,
  useGetUserCommentsInfiniteQuery,
  useSubmitCommentMutation,
  useDeleteCommentMutation
} = commentsApi
