import {getSession} from '@/lib/auth/session'
import config from '@/lib/config'
import {logError} from '@/lib/utils/logging/logError'
import {NextRequest, NextResponse} from 'next/server'
import {validateRedditRequest} from '../utils/routeHelpers'

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
  // Perform all security validations
  const {path, error} = await validateRedditRequest(
    request,
    'subscriptionsApiRoute'
  )
  if (error) return error

  // TypeScript: path is guaranteed non-null here (validated above)
  const validatedPath = path!

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
    const response = await fetch(`https://oauth.reddit.com${validatedPath}`, {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        'User-Agent': config.userAgent
      }
    })

    if (!response.ok) {
      logError('Reddit subscriptions API request failed', {
        component: 'subscriptionsApiRoute',
        action: 'fetchRedditApi',
        path: validatedPath,
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
      path: validatedPath,
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
