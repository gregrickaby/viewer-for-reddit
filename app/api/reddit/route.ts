import {getRedditToken} from '@/lib/actions/redditToken'
import {checkRateLimit} from '@/lib/auth/rateLimit'
import config from '@/lib/config'
import {logError} from '@/lib/utils/logging/logError'
import {validateOrigin} from '@/lib/utils/validation/validateOrigin'
import {isSafeRedditPath} from '@/lib/utils/validation/validateRedditPath'
import {NextRequest, NextResponse} from 'next/server'

/**
 * Determines cache max-age based on Reddit API endpoint type.
 * More static content gets longer cache durations to reduce API calls.
 */
function getCacheMaxAge(path: string): number {
  if (path.includes('/hot.json') || path.includes('/popular')) {
    return 600 // 10 minutes - hot posts change slowly
  }
  if (path.includes('/user/') && path.includes('/about')) {
    return 900 // 15 minutes - user profiles are relatively static
  }
  if (path.includes('/about.json')) {
    return 1800 // 30 minutes - subreddit info is very static
  }
  if (path.includes('autocomplete') || path.includes('/search')) {
    return 180 // 3 minutes - search results
  }
  return 300 // 5 minutes default
}

/**
 * Validates and sanitizes a Reddit API path to prevent SSRF attacks.
 * Uses URL parsing to validate, then reconstructs from scratch to break taint flow.
 *
 * @param path - The user-provided path to validate
 * @returns A sanitized URL string guaranteed to target oauth.reddit.com
 * @throws Error if the path is invalid or potentially malicious
 */
function sanitizeRedditPath(path: string): string {
  // First layer: basic validation before parsing
  if (!path || typeof path !== 'string') {
    throw new Error('Invalid path: must be a non-empty string')
  }

  // Additional validation for encoded traversal attempts
  if (path.includes('%2e%2e') || path.includes('%2E%2E')) {
    throw new Error('Encoded path traversal detected')
  }

  // Parse and validate URL
  let parsedUrl: URL
  try {
    parsedUrl = new URL(path, 'https://oauth.reddit.com')
  } catch {
    throw new Error('Invalid URL format')
  }

  // Verify the normalized URL is still targeting oauth.reddit.com only
  if (
    parsedUrl.origin !== 'https://oauth.reddit.com' ||
    parsedUrl.hostname !== 'oauth.reddit.com' ||
    parsedUrl.protocol !== 'https:'
  ) {
    throw new Error('Invalid destination: must be oauth.reddit.com')
  }

  // Extract components and validate they match expected patterns
  const pathname = parsedUrl.pathname
  const search = parsedUrl.search

  // Validate pathname starts with /
  if (!pathname.startsWith('/')) {
    throw new Error('Invalid pathname')
  }

  // Build the safe URL by explicitly constructing from constant base
  // This creates a new untainted string in CodeQL's analysis
  const TRUSTED_BASE = 'https://oauth.reddit.com'
  const sanitizedUrl = TRUSTED_BASE + pathname + search

  return sanitizedUrl
}

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

    // Use Next.js fetch cache with revalidation based on endpoint type
    const cacheMaxAge = getCacheMaxAge(path)

    // Sanitize and validate path to prevent SSRF
    let safeUrl: string
    try {
      safeUrl = sanitizeRedditPath(path)
    } catch (error) {
      logError('Path sanitization failed - potential SSRF attempt', {
        component: 'redditApiRoute',
        action: 'sanitizePath',
        path,
        error: error instanceof Error ? error.message : String(error),
        url: request.url
      })
      return NextResponse.json(
        {error: 'Invalid Reddit API path'},
        {
          status: 400,
          headers: {
            'Cache-Control': 'no-store, max-age=0'
          }
        }
      )
    }

    const response = await fetch(safeUrl, {
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
    const responseCacheMaxAge = getCacheMaxAge(path)

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
