import {getRedditToken} from '@/lib/actions/redditToken'
import type {SortingOption, SubredditItem} from '@/lib/types'
import type {components} from '@/lib/types/reddit-api'
import {extractAndFilterComments} from '@/lib/utils/commentFilters'
import {fromAbout, fromPopular, fromSearch} from '@/lib/utils/subredditMapper'
import {createApi, fetchBaseQuery} from '@reduxjs/toolkit/query/react'

// Auto-generated type aliases for gradual migration from hand-written types.
type AutoPostCommentsResponse = components['schemas']['GetPostCommentsResponse']
type AutoSubredditAboutResponse =
  components['schemas']['GetSubredditAboutResponse']
type AutoPopularSubredditsResponse =
  components['schemas']['GetPopularSubredditsResponse']
type AutoPopularChildData = NonNullable<
  NonNullable<
    NonNullable<
      components['schemas']['GetPopularSubredditsResponse']['data']
    >['children']
  >[number]['data']
>
type AutoSearchSubredditsResponse =
  components['schemas']['SearchSubredditsResponse']
type AutoSearchChildData = NonNullable<
  NonNullable<
    NonNullable<
      components['schemas']['SearchSubredditsResponse']['data']
    >['children']
  >[number]['data']
>
type AutoSubredditPostsResponse =
  components['schemas']['GetSubredditPostsResponse']
export type AutoPostChild = NonNullable<
  NonNullable<
    components['schemas']['GetSubredditPostsResponse']['data']
  >['children']
>[number]
export type AutoPostChildData = NonNullable<AutoPostChild['data']>
// More specific type for components that need preview and post_hint
export type AutoPostWithMedia = Extract<
  AutoPostChildData,
  {preview?: any; post_hint?: string}
>
type CommentsListing = Extract<
  AutoPostCommentsResponse[number],
  {data?: {children?: any}}
>
export type AutoCommentChild = NonNullable<
  NonNullable<NonNullable<CommentsListing['data']>['children']>[number]
>
export type AutoCommentData = NonNullable<AutoCommentChild['data']>
// More specific type for components that need body and body_html
export type AutoCommentWithText = Extract<
  AutoCommentData,
  {body?: string; body_html?: string}
>

/**
 * Constants.
 */
const MIN_LIMIT = 10
const MAX_LIMIT = 25
const COMMENTS_LIMIT = 25

/**
 * Query parameters for fetching subreddit posts.
 */
export interface SubredditPostsArgs {
  subreddit: string
  sort: SortingOption
}

/**
 * Reddit API service.
 *
 * Provides authenticated access to Reddit endpoints.
 */
export const redditApi = createApi({
  reducerPath: 'redditApi',
  tagTypes: ['SubredditPosts', 'PopularSubreddits', 'Search'],
  baseQuery: fetchBaseQuery({
    baseUrl: 'https://oauth.reddit.com',
    prepareHeaders: async (headers) => {
      const token = await getRedditToken()
      if (token?.access_token) {
        headers.set('Authorization', `Bearer ${token.access_token}`)
      }
      return headers
    }
  }),
  endpoints: (builder) => ({
    /**
     * Search subreddits.
     *
     * @param query - The search query.
     * @param enableNsfw - Whether to include NSFW subreddits.
     *
     * @returns A list of SearchResults.
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
          include_profiles: 'false',
          typeahead_active: 'true'
        })
        return `/api/subreddit_autocomplete_v2?${params.toString()}`
      },
      transformResponse: (response: AutoSearchSubredditsResponse) => {
        // Extract children manually since auto-generated types don't match extractChildren generic
        const children = response.data?.children ?? []
        const childrenData = children
          .map((child) => child.data)
          .filter((data): data is AutoSearchChildData => data !== undefined)

        return childrenData.map(fromSearch)
      },
      providesTags: (_result, _err, {query}) => [{type: 'Search', id: query}]
    }),

    /**
     * Fetches subreddit information.
     *
     * @param subreddit - The subreddit name (e.g., "gifs").
     * @returns A normalized SubredditItem.
     */
    getSubredditAbout: builder.query<SubredditItem, string>({
      query: (subreddit) => `/r/${encodeURIComponent(subreddit)}/about.json`,
      transformResponse: (response: AutoSubredditAboutResponse) =>
        fromAbout(response.data!),
      providesTags: (_result, _err, subreddit) => [
        {type: 'SubredditPosts', id: subreddit}
      ]
    }),

    /**
     * Fetches a sorted list of popular subreddits.
     *
     * @param limit - Number of subreddits to retrieve.
     * @returns An array of normalized SubredditItems.
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

        const sortedChildren = [...childrenData].sort(
          (a, b) => (b.subscribers ?? 0) - (a.subscribers ?? 0)
        )

        return sortedChildren.map(fromPopular)
      },
      providesTags: (result) =>
        result?.length
          ? result.map((sub) => ({
              type: 'PopularSubreddits' as const,
              id: sub.display_name
            }))
          : [{type: 'PopularSubreddits' as const}]
    }),

    /**
     * Fetches paginated posts from a specific subreddit.
     *
     * @param args - Subreddit name and sorting option.
     * @param pageParam - Cursor for the next page.
     * @returns A filtered list of posts without stickied items.
     */
    getSubredditPosts: builder.infiniteQuery<
      AutoSubredditPostsResponse,
      SubredditPostsArgs,
      string | undefined
    >({
      infiniteQueryOptions: {
        initialPageParam: undefined,
        getNextPageParam: (lastPage) => lastPage?.data?.after ?? undefined,
        getPreviousPageParam: () => undefined,
        maxPages: 10
      },
      query({queryArg: {subreddit, sort}, pageParam}) {
        const params = new URLSearchParams({limit: String(MAX_LIMIT)})
        if (pageParam) params.set('after', pageParam)
        // Handle multi-subreddit syntax: encode individual subreddit names but preserve + separators
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
     * Fetches comments for a post.
     *
     * Notes: Filter out AutoModerator comments.
     *
     * @param permalink - The Reddit post permalink.
     * @returns An array of AutoCommentData objects, filtered to exclude AutoModerator comments.
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

        return extractAndFilterComments(children)
      }
    })
  })
})

export const {
  useSearchSubredditsQuery,
  useGetSubredditAboutQuery,
  useGetPopularSubredditsQuery,
  useGetSubredditPostsInfiniteQuery,
  useLazyGetPostCommentsQuery,
  useLazyGetSubredditAboutQuery
} = redditApi
