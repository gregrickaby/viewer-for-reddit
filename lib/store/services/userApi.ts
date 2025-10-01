import type {SubredditItem} from '@/lib/types'
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

interface MineSubredditChild {
  data?: {
    display_name?: string
    icon_img?: string
    community_icon?: string
    over18?: boolean
    public_description?: string
    subscribers?: number
  }
}

interface MineSubredditResponse {
  data?: {
    children?: MineSubredditChild[]
  }
}

interface MultiResponseItem {
  data?: {
    display_name?: string
    name?: string
    path?: string
    icon_url?: string
    description_md?: string
  }
}

const normalizeIcon = (icon?: string | null) => {
  if (!icon) return undefined
  const [cleanIcon] = icon.split('?')
  return cleanIcon
}

const mapMineSubscriptions = (
  response: MineSubredditResponse
): SubredditItem[] => {
  const children = response.data?.children ?? []
  return children
    .map((child) => child.data)
    .filter(
      (
        data
      ): data is NonNullable<MineSubredditChild['data']> & {
        display_name: string
      } => Boolean(data?.display_name)
    )
    .map((data) => ({
      display_name: data.display_name,
      icon_img: normalizeIcon(
        data.icon_img ?? data.community_icon ?? undefined
      ),
      over18: Boolean(data.over18),
      public_description: data.public_description ?? '',
      subscribers: data.subscribers ?? 0,
      value: `r/${data.display_name}`
    }))
}

const mapCustomFeeds = (response: unknown): SubredditItem[] => {
  const items: MultiResponseItem[] = Array.isArray(response)
    ? (response as MultiResponseItem[])
    : ((response as {data?: MultiResponseItem[]})?.data ?? [])

  return items
    .map((item) => item?.data)
    .filter(
      (
        data
      ): data is NonNullable<MultiResponseItem['data']> & {
        display_name: string
        path: string
      } => Boolean(data?.display_name && data?.path)
    )
    .map((data) => ({
      display_name: data.display_name,
      icon_img: normalizeIcon(data.icon_url),
      over18: false,
      public_description: data.description_md ?? '',
      subscribers: 0,
      value: data.path.startsWith('/') ? data.path.slice(1) : data.path
    }))
}

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
  tagTypes: [
    'UserProfile',
    'UserPosts',
    'UserSubscriptions',
    'UserCustomFeeds'
  ],
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
    }),

    /**
     * Fetches authenticated user's subscribed subreddits.
     */
    getUserSubscriptions: builder.query<SubredditItem[], void>({
      query: () => {
        const params = new URLSearchParams({limit: String(MAX_LIMIT)})
        return `/subreddits/mine/subscriber.json?${params.toString()}`
      },
      transformResponse: (response: MineSubredditResponse) =>
        mapMineSubscriptions(response),
      providesTags: (result) =>
        result?.length
          ? [
              ...result.map((item) => ({
                type: 'UserSubscriptions' as const,
                id: item.display_name
              })),
              {type: 'UserSubscriptions' as const}
            ]
          : [{type: 'UserSubscriptions' as const}]
    }),

    /**
     * Fetches authenticated user's custom multi-reddits.
     */
    getUserCustomFeeds: builder.query<SubredditItem[], void>({
      query: () => '/api/multi/mine.json',
      transformResponse: (response: unknown) => mapCustomFeeds(response),
      providesTags: (result) =>
        result?.length
          ? [
              ...result.map((item) => ({
                type: 'UserCustomFeeds' as const,
                id: item.display_name
              })),
              {type: 'UserCustomFeeds' as const}
            ]
          : [{type: 'UserCustomFeeds' as const}]
    })
  })
})

/**
 * Exported RTK Query hooks for User API endpoints.
 * @see {@link https://redux-toolkit.js.org/rtk-query/usage/queries} RTK Query Usage Guide
 */
export const {
  useGetUserProfileQuery,
  useGetUserPostsInfiniteQuery,
  useGetUserSubscriptionsQuery,
  useGetUserCustomFeedsQuery
} = userApi
