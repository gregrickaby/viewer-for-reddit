import type {SortingOption, SubredditItem} from '@/lib/types'
import type {AboutResponseData} from '@/lib/types/about'
import type {PopularResponse} from '@/lib/types/popular'
import type {PostResponse} from '@/lib/types/posts'
import {extractChildren} from '@/lib/utils/extractChildren'
import {fromAbout, fromPopular} from '@/lib/utils/subredditMapper'
import {createApi, fetchBaseQuery} from '@reduxjs/toolkit/query/react'

// Constants
const REDDIT_BASE_URL = 'https://www.reddit.com'

/**
 * Query parameters for fetching subreddit posts.
 */
interface GetSubredditPostsQueryArgs {
  subreddit: string
  sort: SortingOption
}

/**
 * Public Reddit API service.
 *
 * Provides unauthenticated access to Reddit endpoints like popular subreddits
 * and subreddit-specific post listings.
 */
export const publicApi = createApi({
  reducerPath: 'publicApi',
  tagTypes: ['SubredditPosts', 'PopularSubreddits'],
  baseQuery: fetchBaseQuery({baseUrl: REDDIT_BASE_URL}),
  endpoints: (builder) => ({
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
     * @param queryArg - Subreddit name and sorting option.
     * @param pageParam - Cursor for the next page.
     * @returns A filtered list of posts without stickied items.
     */
    getSubredditPosts: builder.infiniteQuery<
      PostResponse,
      GetSubredditPostsQueryArgs,
      string | undefined
    >({
      infiniteQueryOptions: {
        initialPageParam: undefined,
        getNextPageParam: (lastPage) => lastPage?.data?.after ?? undefined,
        getPreviousPageParam: () => undefined,
        maxPages: 10
      },
      query({queryArg, pageParam}) {
        const {subreddit, sort} = queryArg
        return `/r/${subreddit}/${sort}.json?limit=25&after=${pageParam}`
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
    })
  })
})

export const {
  useGetSubredditAboutQuery,
  useGetPopularSubredditsQuery,
  useGetSubredditPostsInfiniteQuery,
  useLazyGetSubredditAboutQuery
} = publicApi
