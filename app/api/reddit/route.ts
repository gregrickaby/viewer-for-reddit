import {getRedditToken} from '@/lib/actions/redditToken'
import config from '@/lib/config'
import {logError} from '@/lib/utils/logging/logError'
import {NextRequest, NextResponse} from 'next/server'
import {
  createErrorResponse,
  getAnonymousCacheMaxAge,
  validateRedditRequest
} from './utils/routeHelpers'

/**
 * Anonymous Reddit API Proxy Route Handler.
 *
 * This endpoint handles read-only, anonymous requests using app-level tokens.
 * Use this for public content that doesn't require user authentication:
 * - Subreddit posts (/r/{subreddit})
 * - Post comments (/r/{subreddit}/comments/{post_id})
 * - User profiles (/user/{username}/about)
 * - Search results (/search)
 *
 * Security measures:
 * - Origin validation
 * - Rate limiting (DoS protection)
 * - Path validation (SSRF protection)
 *
 * For user-specific content (custom feeds, voting, saved posts, etc.),
 * use /api/reddit/me instead.
 *
 * @example
 * fetch('/api/reddit?path=/r/programming/hot.json?limit=25')
 *
 * @param {NextRequest} request - The incoming request object.
 */
export async function GET(request: NextRequest) {
  // Perform all security validations
  const {path, error} = await validateRedditRequest(request, 'redditApiRoute')
  if (error) return error

  // TypeScript: path is guaranteed non-null here (validated above)
  const validatedPath = path!

  try {
    // This proxy is for anonymous/read-only access only
    // User-authenticated requests should use /api/reddit/me
    const token = await getRedditToken()

    if (!token) {
      return createErrorResponse(500, 'Failed to obtain Reddit API token')
    }

    // Use Next.js fetch cache with revalidation based on endpoint type
    const cacheMaxAge = getAnonymousCacheMaxAge(validatedPath)

    // CodeQL SSRF false positive suppression:
    // This fetch is protected by multiple security layers:
    // 1. validateOrigin() - blocks unauthorized origins
    // 2. isSafeRedditPath() - validates path format, blocks .., //, protocols
    // 3. Hardcoded base URL - only targets oauth.reddit.com
    // 4. Rate limiting - prevents DoS attacks
    // The path parameter is validated before reaching this point.
    // lgtm[js/server-side-unvalidated-url-redirection]
    const response = await fetch(`https://oauth.reddit.com${validatedPath}`, {
      headers: {
        Authorization: `Bearer ${token.access_token}`,
        'User-Agent': config.userAgent
      },
      next: {
        revalidate: cacheMaxAge // Cache Reddit responses server-side
      }
    })

    if (!response.ok) {
      // Skip logging expected errors for user and subreddit endpoints
      const isUserEndpoint = validatedPath.includes('/user/')
      const subredditRegex = /^\/r\/[^/]+\/(hot|new|top)\.json/
      const isSubredditEndpoint = subredditRegex.exec(validatedPath) !== null
      const is404 = response.status === 404
      const is403 = response.status === 403

      // Don't log expected errors:
      // - 404 on user endpoints (deleted/suspended users)
      // - 404/403 on subreddit endpoints (banned/private/non-existent communities)
      const isExpectedError =
        (isUserEndpoint && is404) || (isSubredditEndpoint && (is404 || is403))

      if (!isExpectedError) {
        // Log all other errors normally
        logError('Reddit API request failed', {
          component: 'redditApiRoute',
          action: 'fetchRedditApi',
          path: validatedPath,
          status: response.status,
          statusText: response.statusText,
          redditUrl: `https://oauth.reddit.com${validatedPath}`,
          headers: {
            'content-type': response.headers.get('content-type'),
            'x-ratelimit-remaining': response.headers.get(
              'x-ratelimit-remaining'
            ),
            'x-ratelimit-reset': response.headers.get('x-ratelimit-reset')
          }
        })
      }

      return NextResponse.json(
        {error: 'Reddit API error'},
        {
          status: response.status,
          headers: {
            'Cache-Control': 'no-store, max-age=0'
          }
        }
      )
    }

    const data = await response.json()
    const responseCacheMaxAge = getAnonymousCacheMaxAge(validatedPath)

    return NextResponse.json(data, {
      headers: {
        // Use stale-while-revalidate for better UX during high traffic
        'Cache-Control': `public, s-maxage=${responseCacheMaxAge}, stale-while-revalidate=${responseCacheMaxAge * 2}`
      }
    })
  } catch (error) {
    logError(error, {
      component: 'redditApiRoute',
      action: 'proxyRequest',
      path: validatedPath,
      url: request.url,
      method: request.method,
      origin: request.headers.get('origin'),
      userAgent: request.headers.get('user-agent')
    })
    return createErrorResponse(500, 'Internal server error')
  }
}
