import {checkRateLimit} from '@/lib/auth/rateLimit'
import {getSession} from '@/lib/auth/session'
import config from '@/lib/config'
import {logError} from '@/lib/utils/logging/logError'
import {validateOrigin} from '@/lib/utils/validation/validateOrigin'
import {type NextRequest, NextResponse} from 'next/server'

/**
 * Subscribe/Unsubscribe API Route Handler.
 *
 * This endpoint handles subscription changes for subreddits.
 * Requires user authentication and 'subscribe' OAuth scope.
 *
 * Security measures:
 * - Origin validation (CSRF protection)
 * - Rate limiting (prevents subscription spam)
 * - Authentication required
 * - Input validation
 *
 * @see https://www.reddit.com/dev/api#POST_api_subscribe
 *
 * @param {NextRequest} request - The incoming request object.
 */
export async function POST(request: NextRequest) {
  // Validate request origin to prevent CSRF attacks
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

  // Rate limiting: Prevent subscription spam
  const rateLimitResponse = await checkRateLimit(request)
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  try {
    // Get the session
    const session = await getSession()

    // Check if user is authenticated
    if (!session?.accessToken) {
      return NextResponse.json(
        {error: 'Unauthorized'},
        {
          status: 401,
          headers: {
            'Cache-Control': 'no-store, max-age=0'
          }
        }
      )
    }

    // Get the request body
    const body = await request.json()
    const {action, sr_name} = body

    // Validate request body
    if (!action || !sr_name) {
      logError('Invalid subscribe request: missing required fields', {
        component: 'subscribeApiRoute',
        action: 'validateRequest',
        body
      })
      return NextResponse.json(
        {error: 'Missing required fields: action and sr_name'},
        {
          status: 400,
          headers: {
            'Cache-Control': 'no-store, max-age=0'
          }
        }
      )
    }

    // Validate action value
    if (action !== 'sub' && action !== 'unsub') {
      logError('Invalid subscribe request: invalid action value', {
        component: 'subscribeApiRoute',
        action: 'validateRequest',
        body
      })
      return NextResponse.json(
        {error: 'Invalid action. Must be "sub" or "unsub"'},
        {
          status: 400,
          headers: {
            'Cache-Control': 'no-store, max-age=0'
          }
        }
      )
    }

    // Call Reddit API to subscribe/unsubscribe
    const response = await fetch('https://oauth.reddit.com/api/subscribe', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': config.userAgent
      },
      body: new URLSearchParams({
        action,
        sr_name
      })
    })

    // Check if the request was successful
    if (!response.ok) {
      const errorText = await response.text()
      logError('Reddit API subscribe request failed', {
        component: 'subscribeApiRoute',
        action: 'redditApiCall',
        status: response.status,
        statusText: response.statusText,
        errorText,
        sr_name,
        actionType: action
      })
      return NextResponse.json(
        {error: 'Failed to update subscription'},
        {
          status: response.status,
          headers: {
            'Cache-Control': 'no-store, max-age=0'
          }
        }
      )
    }

    // Return success
    return NextResponse.json(
      {
        success: true,
        action,
        sr_name
      },
      {
        headers: {
          'Cache-Control': 'no-store, max-age=0'
        }
      }
    )
  } catch (error) {
    logError(error, {
      component: 'subscribeApiRoute',
      action: 'handleRequest'
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
