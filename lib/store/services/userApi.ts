import type {components} from '@/lib/types/reddit-api'
import {MAX_LIMIT} from '@/lib/utils/apiConstants'
import {baseQuery} from '@/lib/utils/baseQuery/baseQuery'
import {createApi} from '@reduxjs/toolkit/query/react'

/**
 * Type aliases for user-related Reddit API responses.
 *
 * Note: Reddit's API does not provide a dedicated user posts endpoint schema.
 * User posts use the same structure as subreddit posts, so we reuse the
 * GetSubredditPostsResponse schema for type safety.
 */
type AutoUserPostsResponse = components['schemas']['GetSubredditPostsResponse']
type AutoUserProfileResponse = components['schemas']['GetUserProfileResponse']

/** Individual post item from user's submission history */
export type AutoUserPostChild = NonNullable<
  NonNullable<AutoUserPostsResponse['data']>['children']
>[number]

/** Post metadata and content from user's submission history */
export type AutoUserPostData = NonNullable<AutoUserPostChild['data']>

/** User account information and statistics */
export type AutoUserProfileData = NonNullable<AutoUserProfileResponse['data']>

/**
 * RTK Query API for user profiles and submission history.
 *
 * This API uses anonymous baseQuery (/api/reddit) instead of authenticated
 * baseQuery (/api/reddit/me) because user profiles are public data.
 *
 * @see {@link https://redux-toolkit.js.org/rtk-query/overview} RTK Query Overview
 */
export const userApi = createApi({
  reducerPath: 'userApi',
  baseQuery,
  tagTypes: ['User', 'UserProfile', 'UserPosts'],
  endpoints: (builder) => ({
    /**
     * Fetch user profile information.
     *
     * @param username - Reddit username without the u/ prefix
     * @returns User profile with karma, account age, and settings
     *
     * @example
     * const {data, isLoading} = useGetUserProfileQuery('spez')
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
      providesTags: (_result, _err, username) => [
        {type: 'UserProfile', id: username}
      ]
    }),

    /**
     * Fetch user's submitted posts with infinite scroll pagination.
     *
     * @param username - Reddit username without the u/ prefix
     * @param pageParam - Pagination cursor (Reddit's "after" token)
     * @returns Paginated list of user's posts across all subreddits
     *
     * @example
     * const {data, fetchNextPage, hasNextPage} = useGetUserPostsInfiniteQuery('spez')
     */
    getUserPosts: builder.infiniteQuery<
      AutoUserPostsResponse,
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

        const encodedUsername = encodeURIComponent(username)
        return `/user/${encodedUsername}/submitted.json?${params.toString()}`
      },
      transformResponse: (
        response: AutoUserPostsResponse
      ): AutoUserPostsResponse => {
        return response
      },
      providesTags: (_result, _err, username) => [
        {type: 'UserPosts', id: username}
      ]
    })
  })
})

/**
 * Auto-generated hooks for user API endpoints.
 *
 * @see {@link https://redux-toolkit.js.org/rtk-query/usage/queries}
 */
export const {useGetUserProfileQuery, useGetUserPostsInfiniteQuery} = userApi
