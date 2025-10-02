import type {VoteRequest, VoteResponse} from '@/lib/types'
import {createRedditBaseQuery} from '@/lib/utils/baseQuery/createRedditBaseQuery'
import {createApi} from '@reduxjs/toolkit/query/react'

/**
 * Base query for vote API.
 * Uses /api/reddit/vote endpoint for authenticated user votes.
 */
const baseQuery = createRedditBaseQuery('/api/reddit/vote')

/**
 * Vote API service using RTK Query.
 *
 * Handles upvote/downvote operations for posts and comments with optimistic updates.
 * Requires user authentication and 'vote' OAuth scope.
 *
 * Features:
 * - Optimistic UI updates for immediate feedback
 * - Automatic error rollback on failure
 * - Type-safe vote operations
 * - Integration with Reddit's /api/vote endpoint
 *
 * @see {@link https://redux-toolkit.js.org/rtk-query/overview} RTK Query Documentation
 * @see {@link https://www.reddit.com/dev/api/#POST_api_vote} Reddit Vote API
 */
export const voteApi = createApi({
  reducerPath: 'voteApi',
  baseQuery,
  tagTypes: ['Vote'],
  endpoints: (builder) => ({
    /**
     * Submit a vote for a post or comment.
     *
     * Performs optimistic update for immediate UI feedback, with automatic
     * rollback on error. Vote is persisted to Reddit's servers.
     *
     * Vote directions:
     * - 1: Upvote
     * - 0: Unvote (remove existing vote)
     * - -1: Downvote
     *
     * @param {VoteRequest} payload - Vote request with id and direction
     * @param {string} payload.id - Thing fullname (t1_xxx for comment, t3_xxx for post)
     * @param {VoteDirection} payload.dir - Vote direction (1, 0, or -1)
     *
     * @returns {VoteResponse} Success status
     *
     * @example
     * // Upvote a post
     * const [vote] = useVoteMutation()
     * await vote({ id: 't3_abc123', dir: 1 })
     *
     * @example
     * // Remove vote from a comment
     * await vote({ id: 't1_xyz789', dir: 0 })
     */
    vote: builder.mutation<VoteResponse, VoteRequest>({
      query: ({id, dir}) => ({
        url: '',
        method: 'POST',
        body: {id, dir}
      }),
      // Invalidate Vote tags to trigger refetch of affected data
      invalidatesTags: (_result, error) => (error ? [] : ['Vote'])
    })
  })
})

export const {useVoteMutation} = voteApi
