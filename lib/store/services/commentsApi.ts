import type {components} from '@/lib/types/reddit-api'
import {COMMENTS_LIMIT, MAX_LIMIT} from '@/lib/utils/apiConstants'
import {baseQuery} from '@/lib/utils/baseQuery/baseQuery'
import {dynamicBaseQuery} from '@/lib/utils/baseQuery/dynamicBaseQuery'
import {extractAndFilterComments} from '@/lib/utils/commentFilters'
import {createApi} from '@reduxjs/toolkit/query/react'

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
 * RTK Query API for post comments.
 *
 * Uses dynamicBaseQuery to switch between anonymous and authenticated endpoints
 * based on user login state. This allows displaying vote states when authenticated.
 *
 * For user comment history, see userCommentsApi at bottom of file.
 *
 * @see {@link https://redux-toolkit.js.org/rtk-query/overview}
 */
export const commentsApi = createApi({
  reducerPath: 'commentsApi',
  baseQuery: dynamicBaseQuery,
  tagTypes: ['Comments'],
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
        const listing = Array.isArray(response) ? response[1] : response
        const children = listing?.data?.children ?? []
        return extractAndFilterComments(children)
      }
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
      transformResponse: (response: AutoPostCommentsResponse) => response
    })
  })
})

/**
 * RTK Query API for user comment history.
 *
 * Uses anonymous baseQuery instead of dynamicBaseQuery to prevent 403 errors
 * when viewing public user profiles before auth state initializes.
 */
export const userCommentsApi = createApi({
  reducerPath: 'userCommentsApi',
  baseQuery,
  tagTypes: ['UserComments'],
  endpoints: (builder) => ({
    /**
     * Fetch user's comment history with infinite scroll pagination.
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
      infiniteQueryOptions: {
        initialPageParam: undefined,
        getNextPageParam: (lastPage) => lastPage?.data?.after ?? undefined,
        getPreviousPageParam: () => undefined,
        maxPages: 10
      },
      query({queryArg: username, pageParam}) {
        const params = new URLSearchParams({limit: String(MAX_LIMIT)})
        if (pageParam) params.set('after', pageParam)
        return `/user/${username}/comments.json?${params.toString()}`
      },
      transformResponse: (
        response: AutoUserCommentsResponse
      ): AutoUserCommentsResponse => {
        return response
      }
    })
  })
})

/**
 * Auto-generated hooks for post comments API.
 *
 * @see {@link https://redux-toolkit.js.org/rtk-query/usage/queries}
 */
export const {
  useGetPostCommentsPagesInfiniteQuery,
  useGetPostCommentsPagesRawInfiniteQuery,
  useLazyGetPostCommentsQuery,
  useLazyGetPostCommentsRawQuery
} = commentsApi

/**
 * Auto-generated hook for user comments API.
 */
export const {useGetUserCommentsInfiniteQuery} = userCommentsApi
