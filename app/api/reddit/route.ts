import {getRedditToken} from '@/lib/actions/redditToken'
import {checkRateLimit} from '@/lib/auth/rateLimit'
import config from '@/lib/config'
import {logError} from '@/lib/utils/logError'
import {validateOrigin} from '@/lib/utils/validateOrigin'
import {isSafeRedditPath} from '@/lib/utils/validateRedditPath'
import {NextRequest, NextResponse} from 'next/server'

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
  // Validate request origin to prevent external abuse
  if (!validateOrigin(request)) {
    return NextResponse.json(
      {error: 'Forbidden'},
      {
        status: 403,
        headers: {
          'Cache-Control': 'no-store, max-age=0'
        }
      }
    )
  }

  // Rate limiting
  const rateLimitResponse = await checkRateLimit(request)
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  // Extract the Reddit API path from query parameters
  const {searchParams} = new URL(request.url)
  const path = searchParams.get('path')

  if (!path) {
    logError('Missing required path parameter', {
      component: 'redditApiRoute',
      action: 'validatePath',
      url: request.url,
      searchParams: Object.fromEntries(searchParams.entries())
    })
    return NextResponse.json(
      {error: 'Path parameter is required'},
      {
        status: 400,
        headers: {
          'Cache-Control': 'no-store, max-age=0'
        }
      }
    )
  }

  // Validate path to prevent SSRF and abuse
  if (!isSafeRedditPath(path)) {
    logError('Invalid or dangerous Reddit API path', {
      component: 'redditApiRoute',
      action: 'validatePath',
      path,
      url: request.url,
      searchParams: Object.fromEntries(searchParams.entries())
    })
    return NextResponse.json(
      {error: 'Invalid path parameter'},
      {
        status: 400,
        headers: {
          'Cache-Control': 'no-store, max-age=0'
        }
      }
    )
  }

  try {
    // This proxy is for anonymous/read-only access only
    // User-authenticated requests should use /api/reddit/me
    const token = await getRedditToken()

    if (!token) {
      return NextResponse.json(
        {error: 'Failed to obtain Reddit API token'},
        {
          status: 500,
          headers: {
            'Cache-Control': 'no-store, max-age=0'
          }
        }
      )
    }

    const response = await fetch(`https://oauth.reddit.com${path}`, {
      headers: {
        Authorization: `Bearer ${token.access_token}`,
        'User-Agent': config.userAgent
      }
    })

    if (!response.ok) {
      // Skip logging expected errors for user and subreddit endpoints
      const isUserEndpoint = path.includes('/user/')
      const subredditRegex = /^\/r\/[^/]+\/(hot|new|top)\.json/
      const isSubredditEndpoint = subredditRegex.exec(path) !== null
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
          path,
          status: response.status,
          statusText: response.statusText,
          redditUrl: `https://oauth.reddit.com${path}`,
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
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'private, max-age=60'
      }
    })
  } catch (error) {
    logError(error, {
      component: 'redditApiRoute',
      action: 'proxyRequest',
      path,
      url: request.url,
      method: request.method,
      origin: request.headers.get('origin'),
      userAgent: request.headers.get('user-agent')
    })
    return NextResponse.json(
      {error: 'Internal server error'},
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-store, max-age=0'
        }
      }
    )
  }
}
