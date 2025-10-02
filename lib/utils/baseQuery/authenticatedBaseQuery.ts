import {createRedditBaseQuery} from './createRedditBaseQuery'

/**
 * Authenticated Reddit API base query for user-specific requests.
 *
 * This base query handles requests that require user authentication (user session tokens):
 * - Custom Feeds (/user/{username}/m/{customFeedName})
 * - User subscriptions (/subreddits/mine/subscriber)
 * - User home feed (/api/v1/me)
 * - Voting (/api/vote) - future
 * - Saved posts (/user/{username}/saved) - future
 * - User preferences (/api/v1/me/prefs) - future
 *
 * Routes through /api/reddit/me which uses user session tokens.
 * The "/me" convention follows REST patterns and mirrors Reddit's own /api/v1/me/* endpoints.
 *
 * Key features:
 * - Routes through /api/reddit/me proxy
 * - Uses user session tokens (not app tokens)
 * - Graceful degradation when not authenticated
 * - Consistent error handling
 *
 * @example
 * // Used in authenticated API service definitions
 * const authenticatedApi = createApi({
 *   baseQuery: authenticatedBaseQuery,
 *   endpoints: (builder) => ({
 *     getUserCustomFeeds: builder.query({
 *       query: () => '/api/multi/user/{username}'
 *     })
 *   })
 * })
 *
 * @see {@link https://redux-toolkit.js.org/rtk-query/usage/customizing-queries#customizing-queries-with-basequery} RTK Query BaseQuery docs
 */
export const authenticatedBaseQuery = createRedditBaseQuery('/api/reddit/me')
