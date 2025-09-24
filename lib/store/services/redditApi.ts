import type {SortingOption, SubredditItem, UserItem} from '@/lib/types'
import type {components} from '@/lib/types/reddit-api'
import {extractAndFilterComments} from '@/lib/utils/commentFilters'
import {fromAbout, fromPopular, fromSearch} from '@/lib/utils/subredditMapper'
import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn
} from '@reduxjs/toolkit/query/react'

/**
 * Auto-generated type aliases for gradual migration from hand-written types.
 * These types are extracted from the OpenAPI schema and provide type safety
 * for Reddit API responses while maintaining compatibility with existing code.
 */

// Auto-generated type aliases for gradual migration from hand-written types.
type AutoPostCommentsResponse = components['schemas']['GetPostCommentsResponse']
type AutoSubredditAboutResponse =
  components['schemas']['GetSubredditAboutResponse']
type AutoPopularSubredditsResponse =
  components['schemas']['GetPopularSubredditsResponse']

/** Extracted data type for popular subreddit children responses */
type AutoPopularChildData = NonNullable<
  NonNullable<
    NonNullable<
      components['schemas']['GetPopularSubredditsResponse']['data']
    >['children']
  >[number]['data']
>

type AutoSearchSubredditsResponse =
  components['schemas']['SearchSubredditsResponse']

/** Extracted data type for search subreddit children responses */
type AutoSearchChildData = NonNullable<
  NonNullable<
    NonNullable<
      components['schemas']['SearchSubredditsResponse']['data']
    >['children']
  >[number]['data']
>

type AutoSubredditPostsResponse =
  components['schemas']['GetSubredditPostsResponse']

/** Post child type for subreddit posts responses */
export type AutoPostChild = NonNullable<
  NonNullable<
    components['schemas']['GetSubredditPostsResponse']['data']
  >['children']
>[number]

/** Post child data type containing post metadata and content */
export type AutoPostChildData = NonNullable<AutoPostChild['data']>

/** Post type that includes media preview and hint information */
export type AutoPostWithMedia = Extract<
  AutoPostChildData,
  {preview?: any; post_hint?: string}
>

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
export interface AutoCommentData {
  author?: string
  subreddit?: string
  created_utc?: number
  ups?: number
  permalink?: string
  body?: string
  body_html?: string
  id?: string
  name?: string
  parent_id?: string
  children?: string[]
  count?: number
  depth?: number
}

/** Comment type that includes body text content */
export type AutoCommentWithText = Extract<
  AutoCommentData,
  {body?: string; body_html?: string}
>

/** API request limits for Reddit endpoints */
const MIN_LIMIT = 10
const MAX_LIMIT = 25
const COMMENTS_LIMIT = 25

/**
 * Base query that routes all browser requests through the Next.js API proxy.
 *
 * This approach ensures CORS compliance for all browsers:
 * - All client-side requests → routed through /api/reddit/ proxy
 * - Server-side authentication and token management
 * - Eliminates CORS errors for cross-origin requests
 *
 * @param args - RTK Query arguments (URL string or request config object)
 * @param api - RTK Query API object with dispatch and state access
 * @param extraOptions - Additional options passed to the base query
 * @returns Promise resolving to the API response data or error
 */
const proxyBaseQuery: BaseQueryFn = async (args, api, extraOptions) => {
  // Always use proxy for browser requests to avoid CORS issues
  const proxyQuery = fetchBaseQuery({
    baseUrl: '/api/reddit',
    prepareHeaders: (headers) => {
      headers.set('Content-Type', 'application/json')
      return headers
    }
  })

  // Convert the original Reddit API URL to proxy format
  // Example: "/r/programming/hot.json" → "?path=%2Fr%2Fprogramming%2Fhot.json"
  const originalUrl = typeof args === 'string' ? args : args.url
  const proxyArgs =
    typeof args === 'string'
      ? `?path=${encodeURIComponent(originalUrl)}`
      : {...args, url: `?path=${encodeURIComponent(originalUrl)}`}

  return await proxyQuery(proxyArgs, api, extraOptions)
}

/**
 * Query parameters for fetching subreddit posts.
 *
 * @interface SubredditPostsArgs
 * @property {string} subreddit - Subreddit name or multi-subreddit string (e.g., "programming" or "gifs+aww+cats")
 * @property {SortingOption} sort - How to sort posts (hot, new, top, etc.)
 */
export interface SubredditPostsArgs {
  subreddit: string
  sort: SortingOption
}

/**
 * Query parameters for fetching user posts.
 *
 * @interface UserPostsArgs
 * @property {string} username - Reddit username to fetch posts from
 * @property {SortingOption} sort - How to sort posts (hot, new, top, etc.)
 */
export interface UserPostsArgs {
  username: string
  sort: SortingOption
}

/**
 * Query parameters for fetching user comments.
 *
 * @interface UserCommentsArgs
 * @property {string} username - Reddit username to fetch comments from
 * @property {SortingOption} sort - How to sort comments (hot, new, top, etc.)
 */
export interface UserCommentsArgs {
  username: string
  sort: SortingOption
}

/**
 * Reddit API service using RTK Query.
 *
 * Provides authenticated access to Reddit endpoints with smart routing:
 * - iOS Safari: Routes through /api/reddit proxy to bypass CORS restrictions
 * - Other browsers: Direct API calls to oauth.reddit.com for optimal performance
 *
 * Features:
 * - Automatic authentication token management
 * - Response transformation and normalization
 * - Infinite scrolling support for posts
 * - Comprehensive error handling
 * - Cache invalidation and tagging
 *
 * @see {@link https://redux-toolkit.js.org/rtk-query/overview} RTK Query Documentation
 * @see {@link https://www.reddit.com/dev/api/} Reddit API Documentation
 */
export const redditApi = createApi({
  reducerPath: 'redditApi',
  tagTypes: ['SubredditPosts', 'PopularSubreddits', 'Search', 'UserComments'],
  baseQuery: proxyBaseQuery,
  endpoints: (builder) => ({
    /**
     * Search subreddits using Reddit's autocomplete API.
     *
     * Uses the subreddit_autocomplete_v2 endpoint which provides fast,
     * typeahead-style results optimized for search-as-you-type functionality.
     *
     * @param {Object} params - Search parameters
     * @param {string} params.query - The search query string
     * @param {boolean} params.enableNsfw - Whether to include NSFW subreddits in results
     *
     * @returns {SubredditItem[]} Array of normalized subreddit items
     *
     * @example
     * // Search for programming-related subreddits
     * const {data} = useSearchSubredditsQuery({
     *   query: 'programming',
     *   enableNsfw: false
     * })
     */
    searchSubreddits: builder.query<
      SubredditItem[],
      {query: string; enableNsfw: boolean}
    >({
      query: ({query, enableNsfw}) => {
        const params = new URLSearchParams({
          query,
          limit: String(MIN_LIMIT),
          include_over_18: String(enableNsfw),
          include_profiles: 'false', // Exclude user profiles from results
          typeahead_active: 'true' // Enable typeahead optimizations
        })
        return `/api/subreddit_autocomplete_v2?${params.toString()}`
      },
      transformResponse: (response: AutoSearchSubredditsResponse) => {
        // Extract children manually since auto-generated types don't match extractChildren generic
        const children = response.data?.children ?? []
        const childrenData = children
          .map((child) => child.data)
          .filter((data): data is AutoSearchChildData => data !== undefined)

        // Transform to normalized SubredditItem format
        return childrenData.map(fromSearch)
      },
      // Cache results per search query for performance
      providesTags: (_result, _err, {query}) => [{type: 'Search', id: query}]
    }),

    /**
     * Fetches detailed information about a specific subreddit.
     *
     * Retrieves subreddit metadata including description, subscriber count,
     * rules, and other community information from the /about.json endpoint.
     *
     * @param {string} subreddit - The subreddit name (e.g., "programming", "gifs")
     *
     * @returns {SubredditItem} Normalized subreddit information
     *
     * @example
     * // Get information about the programming subreddit
     * const {data} = useGetSubredditAboutQuery('programming')
     */
    getSubredditAbout: builder.query<SubredditItem, string>({
      query: (subreddit) => `/r/${encodeURIComponent(subreddit)}/about.json`,
      transformResponse: (response: AutoSubredditAboutResponse) =>
        fromAbout(response.data!), // Transform to normalized format
      // Cache per subreddit and invalidate when posts are updated
      providesTags: (_result, _err, subreddit) => [
        {type: 'SubredditPosts', id: subreddit}
      ]
    }),

    /**
     * Fetches information about a specific Reddit user.
     *
     * Retrieves user profile data including avatar, karma, account creation date,
     * and other public profile information from Reddit's /user/{username}/about.json endpoint.
     *
     * @param {string} username - The Reddit username (without u/ prefix)
     *
     * @returns {UserItem} User profile information
     *
     * @example
     * // Get user profile information
     * const {data} = useGetUserAboutQuery('spez')
     */
    getUserAbout: builder.query<UserItem, string>({
      query: (username) => `/user/${encodeURIComponent(username)}/about.json`,
      transformResponse: (
        response: {data: any},
        _meta,
        username: string
      ): UserItem => {
        const userData = response.data
        // Return the userData as-is since it matches the auto-generated type
        // Only add fallback for icon if needed
        return {
          ...userData,
          name: userData.name || username,
          icon_img: userData.icon_img || userData.subreddit?.icon_img
        }
      },
      // Cache user data with appropriate tags
      providesTags: (_result, _err, username) => [
        {type: 'UserComments' as const, id: username}
      ]
    }),

    /**
     * Fetches and sorts popular subreddits by subscriber count.
     *
     * Retrieves trending subreddits from Reddit's /subreddits/popular.json endpoint
     * and sorts them by subscriber count in descending order. Useful for discovering
     * active communities and populating recommendation lists.
     *
     * @param {Object} params - Query parameters
     * @param {number} [params.limit=25] - Number of subreddits to retrieve (max 25)
     *
     * @returns {SubredditItem[]} Array of popular subreddits sorted by subscriber count
     *
     * @example
     * // Get top 10 popular subreddits
     * const {data} = useGetPopularSubredditsQuery({limit: 10})
     */
    getPopularSubreddits: builder.query<SubredditItem[], {limit?: number}>({
      query: ({limit = MAX_LIMIT}) => {
        const params = new URLSearchParams({limit: String(limit)})
        return `/subreddits/popular.json?${params.toString()}`
      },
      transformResponse: (response: AutoPopularSubredditsResponse) => {
        // Extract children using type assertion since the structures are compatible at runtime
        const children = response.data?.children ?? []
        const childrenData = children
          .map((child) => child.data)
          .filter((data): data is AutoPopularChildData => data !== undefined)

        // Sort by subscriber count (highest first) for better relevance
        const sortedChildren = [...childrenData].sort(
          (a, b) => (b.subscribers ?? 0) - (a.subscribers ?? 0)
        )

        // Transform to normalized SubredditItem format
        return sortedChildren.map(fromPopular)
      },
      // Provide granular cache tags for each subreddit result
      providesTags: (result) =>
        result?.length
          ? result.map((sub) => ({
              type: 'PopularSubreddits' as const,
              id: sub.display_name
            }))
          : [{type: 'PopularSubreddits' as const}]
    }),

    /**
     * Fetches paginated posts from a specific subreddit with infinite scrolling support.
     *
     * Supports both single subreddits and multi-subreddit queries (e.g., "gifs+aww+cats").
     * Automatically filters out stickied posts and provides pagination cursors for
     * infinite scrolling functionality.
     *
     * Key features:
     * - Multi-subreddit support with proper URL encoding
     * - Infinite pagination with "after" cursors
     * - Automatic sticky post filtering
     * - Configurable sorting options
     *
     * @param {SubredditPostsArgs} args - Query arguments
     * @param {string} args.subreddit - Single subreddit or multi-subreddit string (e.g., "programming" or "gifs+aww")
     * @param {SortingOption} args.sort - Sort method (hot, new, top, rising, etc.)
     * @param {string} [pageParam] - Pagination cursor for next page (Reddit's "after" parameter)
     *
     * @returns {AutoSubredditPostsResponse} Posts response with filtered stickied posts
     *
     * @example
     * // Fetch hot posts from multiple subreddits
     * const {data, fetchNextPage} = useGetSubredditPostsInfiniteQuery({
     *   subreddit: 'programming+webdev+javascript',
     *   sort: 'hot'
     * })
     */
    getSubredditPosts: builder.infiniteQuery<
      AutoSubredditPostsResponse,
      SubredditPostsArgs,
      string | undefined
    >({
      infiniteQueryOptions: {
        initialPageParam: undefined,
        // Extract "after" cursor for next page pagination
        getNextPageParam: (lastPage) => lastPage?.data?.after ?? undefined,
        getPreviousPageParam: () => undefined, // Reddit doesn't support backward pagination
        maxPages: 10 // Limit memory usage for infinite scroll
      },
      query({queryArg: {subreddit, sort}, pageParam}) {
        const params = new URLSearchParams({limit: String(MAX_LIMIT)})
        if (pageParam) params.set('after', pageParam) // Add pagination cursor

        // Handle multi-subreddit syntax: encode individual subreddit names but preserve + separators
        // This fixes the P1 issue where "Fauxmoi+SipsTea+GreenBayPackers" was being over-encoded
        const encodedSubreddit = subreddit
          .split('+')
          .map((sub) => encodeURIComponent(sub))
          .join('+')
        return `/r/${encodedSubreddit}/${sort}.json?${params.toString()}`
      },
      transformResponse: (
        response: AutoSubredditPostsResponse
      ): AutoSubredditPostsResponse => ({
        ...response,
        data: {
          ...response.data,
          // Filter out stickied posts (pinned posts) for cleaner feed experience
          children: (response.data?.children ?? []).filter(
            (child) => child?.data && !child.data.stickied
          )
        }
      }),
      // Cache posts per subreddit for performance
      providesTags: (_result, _err, {subreddit}) => [
        {type: 'SubredditPosts', id: subreddit}
      ]
    }),

    /**
     * Fetches comments for a specific Reddit post.
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
     * Fetches posts submitted by a specific Reddit user with infinite pagination support.
     *
     * Similar to getSubredditPosts but fetches from a user's submitted posts endpoint.
     * Supports pagination using Reddit's "after" parameter for infinite scroll functionality.
     *
     * Features:
     * - Infinite pagination with "after" cursors
     * - Automatic sticky post filtering
     * - Configurable sorting options
     *
     * @param {UserPostsArgs} args - Query arguments
     * @param {string} args.username - Reddit username to fetch posts from
     * @param {SortingOption} args.sort - Sort method (hot, new, top, etc.)
     * @param {string} [pageParam] - Pagination cursor for next page (Reddit's "after" parameter)
     *
     * @returns {AutoSubredditPostsResponse} Posts response with filtered stickied posts
     *
     * @example
     * // Fetch new posts from a specific user
     * const {data, fetchNextPage} = useGetUserPostsInfiniteQuery({
     *   username: 'spez',
     *   sort: 'new'
     * })
     */
    getUserPosts: builder.infiniteQuery<
      AutoSubredditPostsResponse,
      UserPostsArgs,
      string | undefined
    >({
      infiniteQueryOptions: {
        initialPageParam: undefined,
        // Extract "after" cursor for next page pagination
        getNextPageParam: (lastPage) => lastPage?.data?.after ?? undefined,
        getPreviousPageParam: () => undefined, // Reddit doesn't support backward pagination
        maxPages: 10 // Limit memory usage for infinite scroll
      },
      query({queryArg: {username, sort}, pageParam}) {
        const params = new URLSearchParams({
          limit: String(MAX_LIMIT),
          sort // Add sort as a parameter, not in the path
        })
        if (pageParam) params.set('after', pageParam) // Add pagination cursor

        const encodedUsername = encodeURIComponent(username)
        return `/user/${encodedUsername}/submitted/.json?${params.toString()}`
      },
      transformResponse: (
        response: AutoSubredditPostsResponse
      ): AutoSubredditPostsResponse => ({
        ...response,
        data: {
          ...response.data,
          // Filter out stickied posts (pinned posts) for cleaner feed experience.
          children: (response.data?.children ?? []).filter(
            (child) => child?.data && !child.data.stickied
          )
        }
      }),
      providesTags: (_result, _err, {username}) => [
        {type: 'SubredditPosts', id: `user:${username}`}
      ]
    }),

    /**
     * Fetches comments submitted by a specific Reddit user with infinite pagination support.
     *
     * Similar to getUserPosts but fetches from a user's comments endpoint.
     * Supports pagination using Reddit's "after" parameter for infinite scroll functionality.
     *
     * Features:
     * - Infinite pagination with "after" cursors
     * - Configurable sorting options
     * - Returns raw comment data with parent context
     *
     * @param {UserCommentsArgs} args - Query arguments
     * @param {string} args.username - Reddit username to fetch comments from
     * @param {SortingOption} args.sort - Sort method (hot, new, top, etc.)
     * @param {string} [pageParam] - Pagination cursor for next page (Reddit's "after" parameter)
     *
     * @returns {AutoSubredditPostsResponse} Comments response with pagination (uses same structure as posts)
     *
     * @example
     * // Fetch new comments from a specific user
     * const {data, fetchNextPage} = useGetUserCommentsInfiniteQuery({
     *   username: 'spez',
     *   sort: 'new'
     * })
     */
    getUserComments: builder.infiniteQuery<
      AutoSubredditPostsResponse,
      UserCommentsArgs,
      string | undefined
    >({
      infiniteQueryOptions: {
        initialPageParam: undefined,
        // Extract "after" cursor for next page pagination
        getNextPageParam: (lastPage) => lastPage?.data?.after ?? undefined,
        getPreviousPageParam: () => undefined, // Reddit doesn't support backward pagination
        maxPages: 10 // Limit memory usage for infinite scroll
      },
      query({queryArg: {username, sort}, pageParam}) {
        const params = new URLSearchParams({
          limit: String(MAX_LIMIT),
          sort // Add sort as a parameter, not in the path
        })
        if (pageParam) params.set('after', pageParam) // Add pagination cursor

        const encodedUsername = encodeURIComponent(username)
        return `/user/${encodedUsername}/comments/.json?${params.toString()}`
      },
      transformResponse: (
        response: AutoSubredditPostsResponse
      ): AutoSubredditPostsResponse => response, // No filtering needed for comments
      providesTags: (_result, _err, {username}) => [
        {type: 'UserComments', id: `user:${username}`}
      ]
    })
  })
})

/**
 * Exported RTK Query hooks for Reddit API endpoints.
 *
 * These hooks provide type-safe access to Reddit data with automatic caching,
 * loading states, error handling, and background refetching. They integrate
 * seamlessly with React components and provide excellent developer experience.
 *
 * Available hooks:
 * - useSearchSubredditsQuery: Real-time subreddit search with typeahead
 * - useGetSubredditAboutQuery: Subreddit metadata and information
 * - useGetUserAboutQuery: User profile metadata and information
 * - useGetPopularSubredditsQuery: Trending subreddits sorted by popularity
 * - useGetSubredditPostsInfiniteQuery: Paginated posts with infinite scroll
 * - useGetUserPostsInfiniteQuery: Paginated user posts with infinite scroll
 * - useGetUserCommentsInfiniteQuery: Paginated user comments with infinite scroll
 * - useLazyGetPostCommentsQuery: On-demand comment loading for posts
 * - useLazyGetSubredditAboutQuery: On-demand subreddit information loading
 *
 * @see {@link https://redux-toolkit.js.org/rtk-query/usage/queries} RTK Query Usage Guide
 */
export const {
  useSearchSubredditsQuery,
  useGetSubredditAboutQuery,
  useGetUserAboutQuery,
  useGetPopularSubredditsQuery,
  useGetSubredditPostsInfiniteQuery,
  useGetUserPostsInfiniteQuery,
  useGetUserCommentsInfiniteQuery,
  useLazyGetPostCommentsQuery,
  useLazyGetSubredditAboutQuery
} = redditApi
