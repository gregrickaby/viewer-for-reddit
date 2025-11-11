import type {SaveRequest, SaveResponse} from '@/lib/types'
import {createRedditBaseQuery} from '@/lib/utils/api/baseQuery/createRedditBaseQuery'
import {createApi} from '@reduxjs/toolkit/query/react'

/**
 * Base query for save API.
 * Uses /api/reddit/save endpoint for authenticated user saves.
 */
const baseQuery = createRedditBaseQuery('/api/reddit/save')

/**
 * Save API service using RTK Query.
 *
 * Handles save/unsave operations for Reddit posts with cache invalidation.
 * Requires user authentication and 'save' OAuth scope.
 *
 * Features:
 * - Save/unsave posts
 * - Cache invalidation for saved posts feed
 * - Type-safe save operations
 * - Integration with Reddit's /api/save and /api/unsave endpoints
 *
 * @see {@link https://redux-toolkit.js.org/rtk-query/overview} RTK Query Documentation
 * @see {@link https://www.reddit.com/dev/api/#POST_api_save} Reddit Save API
 * @see {@link https://www.reddit.com/dev/api/#POST_api_unsave} Reddit Unsave API
 */
export const saveApi = createApi({
  reducerPath: 'saveApi',
  baseQuery,
  tagTypes: ['Save', 'UserSavedPosts'],
  endpoints: (builder) => ({
    /**
     * Save or unsave a Reddit post.
     *
     * Performs server-side save/unsave operation. The useSave hook handles
     * optimistic UI updates for immediate feedback.
     *
     * On success, invalidates UserSavedPosts tag to refresh saved posts feed.
     *
     * @param {SaveRequest} payload - Save request with id and save flag
     * @param {string} payload.id - Post fullname (t3_xxx)
     * @param {boolean} payload.save - true to save, false to unsave
     *
     * @returns {SaveResponse} Success status and saved state
     *
     * @example
     * // Save a post
     * const [save] = useSaveMutation()
     * await save({ id: 't3_abc123', save: true })
     *
     * @example
     * // Unsave a post
     * await save({ id: 't3_abc123', save: false })
     */
    save: builder.mutation<SaveResponse, SaveRequest>({
      query: ({id, save}) => ({
        url: '',
        method: 'POST',
        body: {id, save}
      }),
      // Invalidate saved posts cache when save/unsave succeeds
      invalidatesTags: ['UserSavedPosts']
    })
  })
})

export const {useSaveMutation} = saveApi
