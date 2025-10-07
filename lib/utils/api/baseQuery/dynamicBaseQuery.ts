import type {BaseQueryFn} from '@reduxjs/toolkit/query/react'
import {authenticatedBaseQuery} from './authenticatedBaseQuery'
import {baseQuery} from './baseQuery'

/**
 * Dynamic base query that automatically switches between authenticated and anonymous modes.
 *
 * This base query intelligently routes requests based on authentication state:
 * - When user is logged in: Uses authenticatedBaseQuery (/api/reddit/me) to get user-specific data including vote states
 * - When user is not logged in: Uses baseQuery (/api/reddit) for anonymous access
 *
 * This ensures that:
 * - Vote states (`likes` field) are properly returned when authenticated
 * - Public content is still accessible without login
 * - RTK Query cache includes user-specific data when available
 *
 * The authentication check happens on the client-side by checking Redux auth state.
 *
 * @example
 * // Used in API service definitions that need vote state
 * const postsApi = createApi({
 *   baseQuery: dynamicBaseQuery,
 *   endpoints: (builder) => ({
 *     getSubredditPosts: builder.query({
 *       query: (subreddit) => `/r/${subreddit}/hot.json`
 *     })
 *   })
 * })
 *
 * @see {@link https://redux-toolkit.js.org/rtk-query/usage/customizing-queries#customizing-queries-with-basequery} RTK Query BaseQuery docs
 */
export const dynamicBaseQuery: BaseQueryFn = async (
  args,
  api,
  extraOptions
) => {
  // Get authentication state from Redux store
  const state = api.getState() as {auth?: {isAuthenticated: boolean}}
  const isAuthenticated = state.auth?.isAuthenticated ?? false

  // Use authenticated base query when logged in, otherwise use anonymous
  const selectedBaseQuery = isAuthenticated ? authenticatedBaseQuery : baseQuery

  return await selectedBaseQuery(args, api, extraOptions)
}
