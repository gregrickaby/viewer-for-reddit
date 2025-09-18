import {getRedditToken} from '@/lib/actions/redditToken'
import type {SortingOption, SubredditItem} from '@/lib/types'
import type {AboutResponseData} from '@/lib/types/about'
import type {
  CommentChild,
  CommentData,
  CommentsListing
} from '@/lib/types/comments'
import type {PopularResponse} from '@/lib/types/popular'
import type {PostResponse} from '@/lib/types/posts'
import type {SearchChildData, SearchResponse} from '@/lib/types/search'
import {extractChildren} from '@/lib/utils/extractChildren'
import {fromAbout, fromPopular} from '@/lib/utils/subredditMapper'
import {createApi, fetchBaseQuery} from '@reduxjs/toolkit/query/react'

/**
 * Constants.
 */
const MIN_LIMIT = 10
const MAX_LIMIT = 25
const COMMENTS_LIMIT = 25
const DELETED_CONTENT_MARKER = '[deleted]'
const REMOVED_CONTENT_MARKER = '[removed]'

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
      SearchChildData[],
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
      transformResponse: (response: SearchResponse) =>
        extractChildren<SearchChildData>(response),
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
      transformResponse: (response: {data: AboutResponseData}) =>
        fromAbout(response.data),
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
      transformResponse: (response: PopularResponse) =>
        extractChildren(response)
          .sort((a, b) => (b.subscribers ?? 0) - (a.subscribers ?? 0))
          .map(fromPopular),
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
      PostResponse,
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
        return `/r/${encodeURIComponent(subreddit)}/${sort}.json?${params.toString()}`
      },
      transformResponse: (response: PostResponse): PostResponse => ({
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
     * @returns An array of CommentData objects, filtered to exclude AutoModerator comments.
     */
    getPostComments: builder.query<CommentData[], string>({
      // Build the API endpoint URL by appending .json to the permalink with a limit of comments
      query: (permalink) => {
        const params = new URLSearchParams({limit: String(COMMENTS_LIMIT)})
        return `${encodeURIComponent(permalink)}.json?${params.toString()}`
      },
      transformResponse: (
        response: [unknown, CommentsListing] | CommentsListing
      ) => {
        // Reddit API returns either a single CommentsListing or an array where:
        // - First element [0] is the post data (which we don't need here)
        // - Second element [1] is the comments listing
        const listing: CommentsListing | undefined = Array.isArray(response)
          ? response[1] // Extract comments from array response
          : response // Use response directly if it's already a CommentsListing

        // Extract the children array from the listing data, defaulting to empty array if undefined
        const children: CommentChild[] = listing?.data?.children ?? []

        return (
          children
            // Extract the actual comment data from each child wrapper object
            .map((c) => c.data)

            // Type guard: Filter out any null/undefined comment data objects
            .filter((data): data is CommentData => Boolean(data))

            // Remove AutoModerator comments as they're typically not useful for users
            .filter((comment) => comment.author !== 'AutoModerator')

            // Filter out deleted, removed, or empty comments
            .filter((comment) => {
              return (
                // Ensure the comment has an author and it's not deleted/removed
                comment.author &&
                comment.author !== DELETED_CONTENT_MARKER &&
                comment.author !== REMOVED_CONTENT_MARKER &&
                // Ensure the comment has content (either plain text body OR HTML body)
                (comment.body || comment.body_html) &&
                // Ensure the comment content itself isn't marked as deleted/removed
                comment.body !== DELETED_CONTENT_MARKER &&
                comment.body !== REMOVED_CONTENT_MARKER
              )
            })
        )
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
