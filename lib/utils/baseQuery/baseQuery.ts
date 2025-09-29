import {fetchBaseQuery, type BaseQueryFn} from '@reduxjs/toolkit/query/react'

/**
 * Custom RTK Query base query that proxies requests through the local API route.
 *
 * This function handles all Reddit API requests by routing them through our
 * local `/api/reddit` proxy endpoint to avoid CORS issues and provide
 * consistent error handling across all API calls.
 *
 * Key features:
 * - Automatic CORS handling via local proxy
 * - Environment-aware URL construction (test vs production)
 * - Consistent header management
 * - URL encoding for safe parameter passing
 *
 * @param args - The request arguments (URL string or request options object)
 * @param api - The RTK Query API object containing dispatch, getState, etc.
 * @param extraOptions - Additional options passed through to fetchBaseQuery
 *
 * @returns Promise resolving to the API response data or error
 *
 * @example
 * // Used in API service definitions
 * const postsApi = createApi({
 *   baseQuery,
 *   endpoints: (builder) => ({
 *     getSubredditPosts: builder.query({
 *       query: (subreddit) => `/r/${subreddit}/hot.json`
 *     })
 *   })
 * })
 *
 * @see {@link https://redux-toolkit.js.org/rtk-query/usage/customizing-queries#customizing-queries-with-basequery} RTK Query BaseQuery docs
 * @see {@link https://www.reddit.com/dev/api/} Reddit API Documentation
 */
export const baseQuery: BaseQueryFn = async (args, api, extraOptions) => {
  // Use absolute URL for tests to avoid URL parsing issues in Node.js environment
  const baseUrl =
    typeof window === 'undefined' || process.env.NODE_ENV === 'test'
      ? 'http://localhost:3000/api/reddit'
      : '/api/reddit'

  // Create the proxy query function with proper headers
  const proxyQuery = fetchBaseQuery({
    baseUrl,
    prepareHeaders: (headers) => {
      headers.set('Content-Type', 'application/json')
      return headers
    }
  })

  // Extract the original URL from args (string or object format)
  const originalUrl = typeof args === 'string' ? args : args.url

  // Construct proxy arguments with URL-encoded path parameter
  const proxyArgs =
    typeof args === 'string'
      ? `?path=${encodeURIComponent(originalUrl)}`
      : {...args, url: `?path=${encodeURIComponent(originalUrl)}`}

  // Execute the proxied request
  return await proxyQuery(proxyArgs, api, extraOptions)
}
