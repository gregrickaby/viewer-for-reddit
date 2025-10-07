import {checkRateLimit} from '@/lib/auth/rateLimit'
import {getSession} from '@/lib/auth/session'
import config from '@/lib/config'
import {logError} from '@/lib/utils/logging/logError'
import {validateOrigin} from '@/lib/utils/validation/validateOrigin'
import {isSafeRedditPath} from '@/lib/utils/validation/validateRedditPath'
import {NextRequest, NextResponse} from 'next/server'

/**
 * Reddit User Subscriptions API Proxy Route Handler.
 *
 * Handles user-authenticated Reddit API requests for subscription data.
 * Returns empty data gracefully when user is not authenticated.
 *
 * Security measures:
 * - Origin validation
 * - Rate limiting
 * - Path validation (SSRF protection)
 * - Graceful degradation for unauthenticated requests
 *
 * @example
 * fetch('/api/reddit/subscriptions?path=/subreddits/mine/subscriber')
 *
 * @param {NextRequest} request - The incoming request object.
 */
export async function GET(request: NextRequest) {
  // Validate request origin
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
      component: 'subscriptionsApiRoute',
      action: 'validatePath',
      url: request.url
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
  // Note: CodeQL SSRF warning is a false positive - isSafeRedditPath() validates
  // all paths against allowed patterns before constructing the URL
  if (!isSafeRedditPath(path)) {
    logError('Invalid or dangerous Reddit API path', {
      component: 'subscriptionsApiRoute',
      action: 'validatePath',
      path
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
    const session = await getSession()

    // Not authenticated - return empty response (graceful degradation)
    if (!session?.accessToken) {
      return NextResponse.json(
        {data: {children: []}},
        {
          headers: {
            'Cache-Control': 'no-store, max-age=0'
          }
        }
      )
    }

    // Safe to use user-provided path - validated by isSafeRedditPath() above
    const response = await fetch(`https://oauth.reddit.com${path}`, {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        'User-Agent': config.userAgent
      }
    })

    if (!response.ok) {
      logError('Reddit subscriptions API request failed', {
        component: 'subscriptionsApiRoute',
        action: 'fetchRedditApi',
        path,
        status: response.status,
        statusText: response.statusText
      })
      // Return empty response for graceful degradation
      return NextResponse.json(
        {data: {children: []}},
        {
          headers: {
            'Cache-Control': 'no-store, max-age=0'
          }
        }
      )
    }

    const data = await response.json()
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-store, max-age=0'
      }
    })
  } catch (error) {
    logError('Unexpected error in subscriptions API proxy', {
      component: 'subscriptionsApiRoute',
      action: 'handleRequest',
      path,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
    // Return empty response for graceful degradation
    return NextResponse.json(
      {data: {children: []}},
      {
        headers: {
          'Cache-Control': 'no-store, max-age=0'
        }
      }
    )
  }
}
