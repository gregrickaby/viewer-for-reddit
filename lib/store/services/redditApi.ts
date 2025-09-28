import type {SortingOption, SubredditItem} from '@/lib/types'
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

// User-related auto-generated types
// The OpenAPI schema in this repo does not include dedicated user posts/comments
// response shapes named `GetUserPostsResponse` or `GetUserCommentsResponse`.
// Reuse compatible generated types to keep typings accurate and avoid hard
// failures when the OpenAPI spec is narrower than runtime responses.
type AutoUserPostsResponse = components['schemas']['GetSubredditPostsResponse']
// The generated GetPostCommentsResponse is an array (post listing + comments
// listing). For user comments we want a single listing element that contains
// a `.data` property. Use the element type of the post comments response.
type AutoUserCommentsResponse = AutoPostCommentsResponse[number]
type AutoUserProfileResponse = components['schemas']['GetUserProfileResponse']

/** Extracted data type for user posts responses */
export type AutoUserPostChild = NonNullable<
  NonNullable<AutoUserPostsResponse['data']>['children']
>[number]

/** User post child data type containing post metadata */
export type AutoUserPostData = NonNullable<AutoUserPostChild['data']>

/** Extracted data type for user comments responses */
export type AutoUserCommentChild = NonNullable<
  NonNullable<AutoUserCommentsResponse['data']>['children']
>[number]

/** User comment child data type */
export type AutoUserCommentData = NonNullable<AutoUserCommentChild['data']>

/** User profile data type */
export type AutoUserProfileData = NonNullable<AutoUserProfileResponse['data']>

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
export type AutoCommentData = NonNullable<AutoCommentChild['data']>

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
 * Custom base query that proxies requests through the local API route.
 * This is needed to avoid CORS issues when making requests to Reddit's API.
 *
 * @param args - The request arguments (URL and options)
 * @param api - The RTK Query API object
 * @param extraOptions - Additional options
 * @returns Promise resolving to the API response data or error
 */
const baseQuery: BaseQueryFn = async (args, api, extraOptions) => {
  // Use absolute URL for tests to avoid URL parsing issues
  const baseUrl =
    typeof window === 'undefined' || process.env.NODE_ENV === 'test'
      ? 'http://localhost:3000/api/reddit'
      : '/api/reddit'

  const proxyQuery = fetchBaseQuery({
    baseUrl,
    prepareHeaders: (headers) => {
      headers.set('Content-Type', 'application/json')
      return headers
    }
  })

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
 * Reddit API service using RTK Query.
 *
 * @see {@link https://redux-toolkit.js.org/rtk-query/overview} RTK Query Documentation
 * @see {@link https://www.reddit.com/dev/api/} Reddit API Documentation
 */
export const redditApi = createApi({
  reducerPath: 'redditApi',
  tagTypes: ['SubredditPosts', 'PopularSubreddits', 'Search'],
  baseQuery,
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

        // Handle multi-subreddit syntax: encode individual subreddit names but preserve + separators.
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
          // Filter out stickied posts (pinned posts) for cleaner feed experience.
          children: (response.data?.children ?? []).filter(
            (child) => child?.data && !child.data.stickied
          )
        }
      }),
      providesTags: (_result, _err, {subreddit}) => [
        {type: 'SubredditPosts', id: subreddit}
      ]
    }),

    /**
     * Fetches comments for a specific Reddit post with infinite loading support.
     *
     * Enables loading more comments beyond the initial limit through pagination.
     * This allows users to access all available comments (e.g., all 600+ comments
     * instead of just the first 25).
     *
     * Key features:
     * - Infinite pagination using Reddit's "after" cursor
     * - Confidence sorting for best comments first
     * - Automatic AutoModerator comment filtering
     * - Memory-efficient with page limits
     * - Processes nested comment threads
     *
     * @param {string} permalink - The Reddit post permalink (e.g., "/r/programming/comments/abc123/title/")
     *
     * @returns {AutoPostCommentsResponse} Comments response with pagination support
     *
     * @example
     * // Fetch comments with infinite loading
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
          // For comments, we need to check if there are more comments to load
          // Reddit comments API returns an array with [post, comments]
          const commentsListing = Array.isArray(lastPage)
            ? lastPage[1]
            : lastPage
          return commentsListing?.data?.after ?? undefined
        },
        getPreviousPageParam: () => undefined,
        maxPages: 20 // Allow more pages for comments than posts
      },
      query({queryArg: permalink, pageParam}) {
        const params = new URLSearchParams({
          limit: String(100), // Increase limit to get more comments
          sort: 'confidence', // Use confidence sorting for best comments first
          ...(pageParam && {after: pageParam})
        })
        return `${permalink}.json?${params.toString()}`
      },
      transformResponse: (response: AutoPostCommentsResponse) => response
    }),

    /**
     * Fetches comments for a specific Reddit post (legacy single request).
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
     * Fetches user profile information.
     *
     * Retrieves detailed information about a Reddit user including karma,
     * account age, profile description, and other public profile data.
     *
     * @param {string} username - The Reddit username (without the u/ prefix)
     *
     * @returns {AutoUserProfileData} User profile information
     *
     * @example
     * // Fetch profile for a specific user
     * const {data: profile} = useGetUserProfileQuery('spez')
     */
    getUserProfile: builder.query<AutoUserProfileData, string>({
      query: (username) => `/user/${username}/about.json`,
      transformResponse: (
        response: AutoUserProfileResponse
      ): AutoUserProfileData => {
        return response.data!
      }
    }),

    /**
     * Fetches posts submitted by a specific user with infinite scrolling support.
     *
     * Retrieves paginated list of posts that a user has submitted across all subreddits.
     * Supports infinite pagination for smooth scrolling experience.
     *
     * @param {string} username - The Reddit username (without the u/ prefix)
     * @param {string} [pageParam] - Pagination cursor for next page
     *
     * @returns {AutoUserPostsResponse} User's submitted posts with pagination info
     *
     * @example
     * // Fetch posts from a user with infinite scroll
     * const {data, fetchNextPage} = useGetUserPostsInfiniteQuery('spez')
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
        maxPages: 10 // Limit memory usage
      },
      query({queryArg: username, pageParam}) {
        const params = new URLSearchParams({limit: String(MAX_LIMIT)})
        if (pageParam) params.set('after', pageParam)
        return `/user/${username}/submitted.json?${params.toString()}`
      },
      transformResponse: (
        response: AutoUserPostsResponse
      ): AutoUserPostsResponse => {
        // Return posts as-is, filtering can be done at component level if needed
        return response
      }
    }),

    /**
     * Fetches comments submitted by a specific user with infinite scrolling support.
     *
     * Retrieves paginated list of comments that a user has made across all subreddits.
     * Supports infinite pagination for smooth scrolling experience.
     *
     * @param {string} username - The Reddit username (without the u/ prefix)
     * @param {string} [pageParam] - Pagination cursor for next page
     *
     * @returns {AutoUserCommentsResponse} User's submitted comments with pagination info
     *
     * @example
     * // Fetch comments from a user with infinite scroll
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
        maxPages: 10 // Limit memory usage
      },
      query({queryArg: username, pageParam}) {
        const params = new URLSearchParams({limit: String(MAX_LIMIT)})
        if (pageParam) params.set('after', pageParam)
        return `/user/${username}/comments.json?${params.toString()}`
      },
      transformResponse: (
        response: AutoUserCommentsResponse
      ): AutoUserCommentsResponse => {
        // Return comments as-is, filtering can be done at component level if needed
        return response
      }
    }),

    /**
     * Fetches a single Reddit post with its comments in a unified response.
     *
     * Retrieves both post data and comments from Reddit's permalink endpoint, which
     * returns a two-element array containing post listing and comments listing.
     * This provides a complete view of a single post for dedicated post pages.
     *
     * Key features:
     * - Unified post and comments in single request
     * - Automatic comment filtering (removes AutoModerator)
     * - Type-safe response transformation
     * - Handles Reddit's dual response array format
     *
     * @param {Object} params - Query parameters
     * @param {string} params.subreddit - The subreddit name (e.g., "programming")
     * @param {string} params.postId - The Reddit post ID (e.g., "abc123")
     *
     * @returns {Object} Object containing post data and filtered comments array
     * @returns {AutoPostChildData} returns.post - The post data with all metadata
     * @returns {AutoCommentData[]} returns.comments - Array of filtered comment data
     *
     * @example
     * // Fetch a single post with comments
     * const {data, isLoading} = useGetSinglePostQuery({
     *   subreddit: 'programming',
     *   postId: 'abc123'
     * })
     * // data = { post: {...}, comments: [...] }
     */
    getSinglePost: builder.query<
      {post: AutoPostChildData; comments: AutoCommentData[]},
      {subreddit: string; postId: string}
    >({
      query: ({subreddit, postId}) => {
        const params = new URLSearchParams({limit: String(COMMENTS_LIMIT)})
        const encodedSubreddit = encodeURIComponent(subreddit)
        const encodedPostId = encodeURIComponent(postId)
        return `/r/${encodedSubreddit}/comments/${encodedPostId}.json?${params.toString()}`
      },
      transformResponse: (
        response: AutoPostCommentsResponse
      ): {
        post: AutoPostChildData
        comments: AutoCommentData[]
      } => {
        // Reddit returns [postListing, commentsListing] array for single post requests
        if (!Array.isArray(response) || response.length < 2) {
          throw new Error(
            `Invalid single post response format: expected an array of length >= 2, but received: ${JSON.stringify(response)}`
          )
        }

        const [postListing, commentsListing] = response

        // Extract post data from first listing
        const postChildren = postListing?.data?.children ?? []
        if (postChildren.length === 0) {
          throw new Error('Post not found')
        }
        const post = postChildren[0].data as AutoPostChildData
        if (!post) {
          throw new Error('Post data is missing')
        }

        // Extract and filter comments from second listing
        const commentChildren = commentsListing?.data?.children ?? []
        const comments = extractAndFilterComments(commentChildren)

        return {post, comments}
      },
      // Cache by subreddit and post ID combination
      providesTags: (_result, _err, {subreddit, postId}) => [
        {type: 'SubredditPosts', id: `${subreddit}:${postId}`}
      ]
    })
  })
})

/**
 * Exported RTK Query hooks for Reddit API endpoints.
 * @see {@link https://redux-toolkit.js.org/rtk-query/usage/queries} RTK Query Usage Guide
 */
export const {
  useSearchSubredditsQuery,
  useGetSubredditAboutQuery,
  useGetPopularSubredditsQuery,
  useGetSubredditPostsInfiniteQuery,
  useGetPostCommentsPagesInfiniteQuery,
  useLazyGetPostCommentsQuery,
  useLazyGetSubredditAboutQuery,
  useGetUserProfileQuery,
  useGetUserPostsInfiniteQuery,
  useGetUserCommentsInfiniteQuery,
  useGetSinglePostQuery
} = redditApi
