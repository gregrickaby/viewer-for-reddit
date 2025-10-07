import {createRedditBaseQuery} from './createRedditBaseQuery'

/**
 * Anonymous Reddit API base query for read-only requests.
 *
 * This base query handles public Reddit content that doesn't require user authentication:
 * - Subreddit posts (/r/{subreddit})
 * - Post comments (/r/{subreddit}/comments/{post_id})
 * - User profiles (/user/{username}/about)
 * - Search results (/search)
 * - Popular/trending content
 *
 * Routes through /api/reddit which uses app-level tokens for authentication.
 *
 * Key features:
 * - Automatic CORS handling via local proxy
 * - Environment-aware URL construction (test vs production)
 * - Consistent header management
 * - URL encoding for safe parameter passing
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
export const baseQuery = createRedditBaseQuery('/api/reddit')
