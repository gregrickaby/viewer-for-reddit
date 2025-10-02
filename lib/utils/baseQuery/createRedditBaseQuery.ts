import {fetchBaseQuery, type BaseQueryFn} from '@reduxjs/toolkit/query/react'

/**
 * Factory function to create a Reddit API base query with proxy routing.
 *
 * This factory eliminates duplication between anonymous and authenticated base queries
 * by providing a single source of truth for the proxy pattern.
 *
 * @param proxyPath - The local proxy route path (e.g., '/api/reddit' or '/api/reddit/me')
 * @returns A configured BaseQueryFn that routes through the specified proxy
 *
 * @example
 * // Create anonymous base query
 * const baseQuery = createRedditBaseQuery('/api/reddit')
 *
 * // Create authenticated base query
 * const authenticatedBaseQuery = createRedditBaseQuery('/api/reddit/me')
 */
export function createRedditBaseQuery(proxyPath: string): BaseQueryFn {
  return async (args, api, extraOptions) => {
    // Use absolute URL for tests to avoid URL parsing issues in Node.js environment
    const baseUrl =
      typeof window === 'undefined' || process.env.NODE_ENV === 'test'
        ? `http://localhost:3000${proxyPath}`
        : proxyPath

    // Create the proxy query function with proper headers
    const proxyQuery = fetchBaseQuery({
      baseUrl,
      prepareHeaders: (headers) => {
        headers.set('Content-Type', 'application/json')
        return headers
      }
    })

    // Extract the original Reddit API path from args (string or object format)
    const redditPath = typeof args === 'string' ? args : args.url

    // Construct proxy arguments with URL-encoded path parameter
    const proxyArgs =
      typeof args === 'string'
        ? `?path=${encodeURIComponent(redditPath)}`
        : {...args, url: `?path=${encodeURIComponent(redditPath)}`}

    // Execute the proxied request
    return await proxyQuery(proxyArgs, api, extraOptions)
  }
}
