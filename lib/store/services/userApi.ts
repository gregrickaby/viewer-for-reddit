import type {components} from '@/lib/types/reddit-api'
import {MAX_LIMIT} from '@/lib/utils/apiConstants'
import {baseQuery} from '@/lib/utils/baseQuery/baseQuery'
import {createApi} from '@reduxjs/toolkit/query/react'

/**
 * Auto-generated type aliases for user-related Reddit API responses.
 * These types are extracted from the OpenAPI schema and provide type safety
 * for user-related Reddit API responses while maintaining compatibility with existing code.
 */

// User-related auto-generated types
// The OpenAPI schema in this repo does not include dedicated user posts
// response shapes named `GetUserPostsResponse`.
// Reuse compatible generated types to keep typings accurate and avoid hard
// failures when the OpenAPI spec is narrower than runtime responses.
type AutoUserPostsResponse = components['schemas']['GetSubredditPostsResponse']
type AutoUserProfileResponse = components['schemas']['GetUserProfileResponse']

/** Extracted data type for user posts responses */
export type AutoUserPostChild = NonNullable<
  NonNullable<AutoUserPostsResponse['data']>['children']
>[number]

/** User post child data type containing post metadata */
export type AutoUserPostData = NonNullable<AutoUserPostChild['data']>

/** User profile data type */
export type AutoUserProfileData = NonNullable<AutoUserProfileResponse['data']>

/**
 * User API service using RTK Query.
 *
 * Handles all user-related operations including profile information,
 * submitted posts, and user activity data from Reddit's API.
 *
 * @see {@link https://redux-toolkit.js.org/rtk-query/overview} RTK Query Documentation
 * @see {@link https://www.reddit.com/dev/api/} Reddit API Documentation
 */
export const userApi = createApi({
  reducerPath: 'userApi',
  tagTypes: ['UserProfile', 'UserPosts'],
  baseQuery,
  endpoints: (builder) => ({
    /**
     * Fetches user profile information.
     *
     * Retrieves detailed information about a Reddit user including karma,
     * account age, profile description, and other public profile data.
     *
     * Key features:
     * - Complete user profile metadata
     * - Karma breakdown (link + comment)
     * - Account status flags (employee, moderator, etc.)
     * - Privacy settings and verification status
     *
     * @param {string} username - The Reddit username (without the u/ prefix)
     *
     * @returns {AutoUserProfileData} User profile information
     *
     * @example
     * // Fetch profile for a specific user
     * const {data: profile, isLoading} = useGetUserProfileQuery('spez')
     *
     * // Access profile data
     * if (profile) {
     *   console.log(`${profile.name} has ${profile.total_karma} total karma`)
     * }
     */
    getUserProfile: builder.query<AutoUserProfileData, string>({
      query: (username) => `/user/${encodeURIComponent(username)}/about.json`,
      transformResponse: (
        response: AutoUserProfileResponse
      ): AutoUserProfileData => {
        if (!response.data) {
          throw new Error('User profile data is missing')
        }
        return response.data
      },
      // Cache per user profile
      providesTags: (_result, _err, username) => [
        {type: 'UserProfile', id: username}
      ]
    }),

    /**
     * Fetches posts submitted by a specific user with infinite scrolling support.
     *
     * Retrieves paginated list of posts that a user has submitted across all subreddits.
     * Supports infinite pagination for smooth scrolling experience in user profiles.
     *
     * Key features:
     * - Infinite scroll pagination with Reddit's "after" cursors
     * - Cross-subreddit post history
     * - Memory-efficient with page limits
     * - Automatic URL encoding for usernames with special characters
     *
     * @param {string} username - The Reddit username (without the u/ prefix)
     * @param {string} [pageParam] - Pagination cursor for next page (Reddit's "after" parameter)
     *
     * @returns {AutoUserPostsResponse} User's submitted posts with pagination info
     *
     * @example
     * // Fetch posts from a user with infinite scroll
     * const {
     *   data,
     *   fetchNextPage,
     *   hasNextPage,
     *   isLoading
     * } = useGetUserPostsInfiniteQuery('spez')
     *
     * // Access paginated data
     * const allPosts = data?.pages.flatMap(page => page.data?.children ?? [])
     */
    getUserPosts: builder.infiniteQuery<
      AutoUserPostsResponse,
      string,
      string | undefined
    >({
      infiniteQueryOptions: {
        initialPageParam: undefined,
        getNextPageParam: (lastPage) => lastPage?.data?.after ?? undefined,
        getPreviousPageParam: () => undefined, // Reddit doesn't support backward pagination
        maxPages: 10 // Limit memory usage for infinite scroll
      },
      query({queryArg: username, pageParam}) {
        const params = new URLSearchParams({limit: String(MAX_LIMIT)})
        if (pageParam) params.set('after', pageParam) // Add pagination cursor

        const encodedUsername = encodeURIComponent(username)
        return `/user/${encodedUsername}/submitted.json?${params.toString()}`
      },
      transformResponse: (
        response: AutoUserPostsResponse
      ): AutoUserPostsResponse => {
        // Return posts as-is, filtering can be done at component level if needed
        return response
      },
      // Cache per user's post history
      providesTags: (_result, _err, username) => [
        {type: 'UserPosts', id: username}
      ]
    })
  })
})

/**
 * Exported RTK Query hooks for User API endpoints.
 * @see {@link https://redux-toolkit.js.org/rtk-query/usage/queries} RTK Query Usage Guide
 */
export const {useGetUserProfileQuery, useGetUserPostsInfiniteQuery} = userApi
