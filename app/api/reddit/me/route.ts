import {getSession} from '@/lib/auth/session'
import config from '@/lib/config'
import {logError} from '@/lib/utils/logging/logError'
import {NextRequest, NextResponse} from 'next/server'
import {
  createErrorResponse,
  getAuthenticatedCacheMaxAge,
  validateRedditRequest
} from '../utils/routeHelpers'

/**
 * User-Authenticated Reddit API Proxy Route Handler (/me).
 *
 * This endpoint handles requests that require user authentication (user session tokens).
 * The "/me" convention follows REST patterns and mirrors Reddit's own /api/v1/me/* endpoints.
 *
 * Security measures:
 * - Origin validation (CSRF protection)
 * - Rate limiting (DoS protection)
 * - Path validation (SSRF protection)
 * - Authentication required
 *
 * Use this for user-specific resources:
 * - Custom Feeds (/user/{username}/m/{customFeedName})
 * - User home feed (/api/v1/me)
 * - Voting (/api/vote)
 * - Subscriptions (/subreddits/mine/subscriber)
 * - Saved posts (/user/{username}/saved)
 * - User preferences (/api/v1/me/prefs)
 *
 * Anonymous/read-only requests should use /api/reddit instead.
 *
 * @example
 * fetch('/api/reddit/me?path=/user/abc123/m/one/hot.json')
 *
 * @param {NextRequest} request - The incoming request object.
 */
export async function GET(request: NextRequest) {
  // Perform all security validations
  const {path, error} = await validateRedditRequest(request, 'redditMeApiRoute')
  if (error) return error

  // TypeScript: path is guaranteed non-null here (validated above)
  const validatedPath = path!

  try {
    // Get user session token
    const session = await getSession()

    if (!session?.accessToken) {
      return createErrorResponse(401, 'Authentication required')
    }

    // Safe to use user-provided path - validated by isSafeRedditPath() above
    const cacheMaxAge = getAuthenticatedCacheMaxAge(validatedPath)
    const response = await fetch(`https://oauth.reddit.com${validatedPath}`, {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        'User-Agent': config.userAgent
      },
      // Cache authenticated requests server-side (except actions like voting)
      next: cacheMaxAge > 0 ? {revalidate: cacheMaxAge} : undefined
    })

    if (!response.ok) {
      logError('Reddit /me API request failed', {
        component: 'redditMeApiRoute',
        action: 'fetchReddit',
        path: validatedPath,
        status: response.status,
        statusText: response.statusText
      })
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
    const responseCacheMaxAge = getAuthenticatedCacheMaxAge(validatedPath)

    return NextResponse.json(data, {
      headers: {
        // Use private cache for user-specific data, no caching for actions
        'Cache-Control':
          responseCacheMaxAge > 0
            ? `private, max-age=${responseCacheMaxAge}, stale-while-revalidate=${responseCacheMaxAge * 2}`
            : 'no-store, max-age=0'
      }
    })
  } catch (error) {
    logError('Reddit /me API proxy error', {
      component: 'redditMeApiRoute',
      action: 'proxyRequest',
      path: validatedPath,
      error
    })
    return createErrorResponse(500, 'Internal server error')
  }
}
