import type {SubmitCommentRequest, SubmitCommentResponse} from '@/lib/types'
import {createRedditBaseQuery} from '@/lib/utils/api/baseQuery/createRedditBaseQuery'
import {createApi} from '@reduxjs/toolkit/query/react'

/**
 * Base query for comment submission API.
 * Uses /api/reddit/comment endpoint for authenticated user comment submissions.
 */
const baseQuery = createRedditBaseQuery('/api/reddit/comment')

/**
 * Comment Submission API service using RTK Query.
 *
 * Handles comment submission operations with automatic cache invalidation.
 * Requires user authentication and 'submit' OAuth scope.
 *
 * Features:
 * - Type-safe comment submission
 * - Automatic cache invalidation for comment and user comment feeds
 * - Integration with Reddit's /api/comment endpoint
 * - Error handling for missing scopes and rate limiting
 *
 * @see {@link https://redux-toolkit.js.org/rtk-query/overview} RTK Query Documentation
 * @see {@link https://www.reddit.com/dev/api#POST_api_comment} Reddit Comment API
 */
export const commentSubmitApi = createApi({
  reducerPath: 'commentSubmitApi',
  baseQuery,
  tagTypes: ['Comments', 'UserComments'],
  endpoints: (builder) => ({
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
      query: ({thing_id, text}) => ({
        url: '',
        method: 'POST',
        body: {thing_id, text}
      }),
      // Invalidate both comment feed caches to trigger automatic refetch
      invalidatesTags: ['Comments', 'UserComments']
    })
  })
})

export const {useSubmitCommentMutation} = commentSubmitApi
