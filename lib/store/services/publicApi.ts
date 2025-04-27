import type {PopularListing, RedditResponse, SortingOption} from '@/lib/types'
import {createApi, fetchBaseQuery} from '@reduxjs/toolkit/query/react'

/**
 * Query argument for fetching subreddit posts.
 *
 * @property {string} subreddit - The subreddit name.
 * @property {'hot' | 'top' | 'new' | 'rising' | 'controversial'} sort - The sorting option.
 */
interface GetSubredditPostsQueryArgs {
  subreddit: string
  sort: SortingOption
}

/**
 * Public Reddit API service.
 *
 * This service provides public access to Reddit API endpoints, including fetching
 * popular subreddits and posts from a specific subreddit with infinite pagination.
 */
export const publicApi = createApi({
  reducerPath: 'publicApi',
  tagTypes: ['SubredditPosts', 'PopularSubreddits'],
  baseQuery: fetchBaseQuery({baseUrl: 'https://www.reddit.com'}),
  endpoints: (builder) => ({
    /**
     * Fetch popular subreddits.
     *
     * This endpoint uses an infinite query to support pagination.
     * It fetches popular subreddits with optional page tokens.
     *
     * @returns {RedditSearchResponse} The response containing a list of popular subreddits.
     */
    getPopularSubreddits: builder.infiniteQuery<PopularListing, void, string>({
      query: ({pageParam}) => {
        // Create query params.
        const params = new URLSearchParams({
          limit: '25',
          raw_json: '1'
        })

        // Append the page token if provided.
        if (pageParam) {
          params.append('after', pageParam)
        }

        // Return the URL with query params.
        return `/subreddits/popular.json?${params.toString()}`
      },
      infiniteQueryOptions: {
        // The initial page param is an empty string.
        initialPageParam: '',
        // Limit the number of cached pages.
        maxPages: 10,
        // Extract the next page token from the last page's response.
        getNextPageParam: (lastPage) => lastPage.data?.after ?? null,
        // Not implementing previous page logic.
        getPreviousPageParam: () => null
      },
      // Sort subreddits by subscribers count.
      transformResponse: (response: PopularListing) => {
        const sortedChildren = response.data?.children
          ? [...response.data.children].sort(
              (a, b) =>
                b.data.subreddit_subscribers - a.data.subreddit_subscribers
            )
          : []
        return {
          ...response,
          data: {
            ...response.data,
            children: sortedChildren
          }
        }
      }
    }),

    /**
     * Fetch posts from a specific subreddit with pagination.
     *
     * This endpoint fetches posts from a subreddit using the selected sort option.
     * It also filters out stickied posts from the response.
     *
     * @param {GetSubredditPostsQueryArgs} queryArg - An object containing the subreddit and sort.
     * @param {string | undefined} pageParam - The page token (Reddit "after" token).
     * @returns {RedditResponse} The response containing subreddit posts.
     */
    getSubredditPosts: builder.infiniteQuery<
      RedditResponse, // Response type
      GetSubredditPostsQueryArgs, // Query argument type (subreddit and sort)
      string | undefined // Page parameter (Reddit "after" token)
    >({
      infiniteQueryOptions: {
        // For the initial request, no page token is required.
        initialPageParam: undefined,
        // Limit the number of cached pages (adjustable as needed).
        maxPages: 10,
        // Extract the next page token from the response.
        getNextPageParam: (lastPage) => lastPage.data.after ?? undefined,
        // No previous page handling.
        getPreviousPageParam: () => undefined
      },
      // Build the request URL using URLSearchParams.
      query({queryArg, pageParam}) {
        // Extract the subreddit and sort from the query argument.
        const {subreddit, sort} = queryArg

        // Create query params.
        const params = new URLSearchParams({
          limit: '10',
          raw_json: '1'
        })

        // Append the page token if provided.
        if (pageParam) {
          params.append('after', pageParam)
        }

        // Return the URL with query params.
        return `/r/${subreddit}/${sort}.json?${params.toString()}`
      },
      // Transform the response to filter out stickied posts.
      transformResponse: (response: RedditResponse) => ({
        ...response,
        data: {
          ...response.data,
          children: response.data.children.filter(({data}) => !data.stickied)
        }
      })
    })
  })
})

// Export the auto-generated hooks for the endpoints.
export const {
  useGetPopularSubredditsInfiniteQuery,
  useGetSubredditPostsInfiniteQuery
} = publicApi
