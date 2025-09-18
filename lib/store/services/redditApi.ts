import {getRedditToken} from '@/lib/actions/redditToken'
import type {SortingOption, SubredditItem} from '@/lib/types'
import type {AboutResponseData} from '@/lib/types/about'
import type {
  CommentChild,
  CommentData,
  CommentsListing
} from '@/lib/types/comments'
import type {PopularResponse} from '@/lib/types/popular'
import type {PostChild, PostResponse} from '@/lib/types/posts'
import type {SearchChildData, SearchResponse} from '@/lib/types/search'
import {extractChildren} from '@/lib/utils/extractChildren'
import {fromAbout, fromPopular} from '@/lib/utils/subredditMapper'
import {createApi, fetchBaseQuery} from '@reduxjs/toolkit/query/react'

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
      query: ({query, enableNsfw}) =>
        `/api/subreddit_autocomplete_v2?query=${query}&limit=10&include_over_18=${enableNsfw}&include_profiles=false&typeahead_active=true`,
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
      query: (subreddit) => `/r/${subreddit}/about.json`,
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
      query: ({limit = 25}) => `/subreddits/popular.json?limit=${limit}`,
      transformResponse: (response: PopularResponse) =>
        extractChildren(response)
          .sort((a, b) => (b.subscribers ?? 0) - (a.subscribers ?? 0))
          .map(fromPopular),
      providesTags: (result) =>
        result?.length
          ? result.map((sub) => ({
              type: 'PopularSubreddits',
              id: sub.display_name
            }))
          : ['PopularSubreddits']
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
        return `/r/${subreddit}/${sort}.json?limit=25&after=${pageParam ?? ''}`
      },
      transformResponse: (response: PostResponse): PostResponse => ({
        ...response,
        data: {
          ...response.data,
          children: (response.data?.children ?? []).filter(
            (child: PostChild) => child?.data && !child.data.stickied
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
      query: (permalink) => `${permalink}.json?limit=25`,
      transformResponse: (
        response: [unknown, CommentsListing] | CommentsListing
      ) => {
        const listing: CommentsListing | undefined = Array.isArray(response)
          ? response[1]
          : response
        const children: CommentChild[] = listing?.data?.children ?? []
        return children
          .map((c) => c.data)
          .filter((data): data is CommentData => Boolean(data))
          .filter((comment) => comment.author !== 'AutoModerator')
          .filter((comment) => {
            // Filter out deleted/removed comments and comments without content
            return (
              comment.author &&
              comment.author !== '[deleted]' &&
              comment.author !== '[removed]' &&
              (comment.body || comment.body_html) &&
              comment.body !== '[deleted]' &&
              comment.body !== '[removed]'
            )
          })
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
