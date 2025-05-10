import type {
  PopularListingResponse,
  PopularSubredditChild,
  RedditResponse,
  SortingOption
} from '@/lib/types'
import {createApi, fetchBaseQuery} from '@reduxjs/toolkit/query/react'

/**
 * Query parameters for fetching subreddit posts.
 */
interface GetSubredditPostsQueryArgs {
  subreddit: string
  sort: SortingOption
}

/**
 * Extracts subscriber count from a child for sorting.
 */
export function getSubscriberCount(child: PopularSubredditChild): number {
  return child.data?.subscribers ?? 0
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
  baseQuery: fetchBaseQuery({baseUrl: 'https://www.reddit.com'}),
  endpoints: (builder) => ({
    /**
     * Fetches popular subreddits.
     *
     * @param limit - Number of subreddits to retrieve.
     * @returns Sorted list of popular subreddits.
     */
    getPopularSubreddits: builder.query<
      PopularListingResponse,
      {limit?: number}
    >({
      query: ({limit = 25}) => {
        return `/subreddits/popular.json?${limit}`
      },
      transformResponse: (response: PopularListingResponse) => {
        // Sort the subreddits by subscriber count in descending order.
        const sorted = [...(response.data?.children ?? [])].sort(
          (a, b) => getSubscriberCount(b) - getSubscriberCount(a)
        )

        return {
          ...response,
          data: {
            ...response.data,
            children: sorted
          }
        }
      },
      providesTags: ['PopularSubreddits']
    }),

    /**
     * Gets posts from a specific subreddit.
     *
     * @param queryArg - The subreddit and sorting option.
     * @param pageParam - The pagination token for the next page of results.
     * @returns An infinite list of posts from the subreddit.
     */
    getSubredditPosts: builder.infiniteQuery<
      RedditResponse,
      GetSubredditPostsQueryArgs,
      string | undefined
    >({
      infiniteQueryOptions: {
        initialPageParam: undefined,
        getNextPageParam: (lastPage) => lastPage.data.after ?? undefined,
        getPreviousPageParam: () => undefined,
        maxPages: 10
      },
      query({queryArg, pageParam}) {
        const {subreddit, sort} = queryArg
        return `/r/${subreddit}/${sort}.json?limit=25&after=${pageParam}`
      },
      transformResponse: (response: RedditResponse) => {
        // Filter out stickied posts from the response.
        const filteredChildren = response.data.children.filter(
          ({data}) => !data.stickied
        )

        return {
          ...response,
          data: {
            ...response.data,
            children: filteredChildren
          }
        }
      }
    })
  })
})

export const {useGetPopularSubredditsQuery, useGetSubredditPostsInfiniteQuery} =
  publicApi
