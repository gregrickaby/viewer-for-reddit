import {checkRateLimit} from '@/lib/auth/rateLimit'
import {getSession} from '@/lib/auth/session'
import config from '@/lib/config'
import {logError} from '@/lib/utils/logging/logError'
import {validateOrigin} from '@/lib/utils/validation/errors/validateOrigin'
import {type NextRequest, NextResponse} from 'next/server'

/**
 * Save/Unsave Post API Route Handler.
 *
 * This endpoint handles save/unsave requests for Reddit posts.
 * Requires user authentication and 'save' OAuth scope.
 *
 * Security measures:
 * - Origin validation (CSRF protection)
 * - Rate limiting (prevents save spam)
 * - Authentication required
 * - Input validation (id format, save boolean)
 *
 * Reddit Save API:
 * - Endpoint: POST /api/save (save) or POST /api/unsave (unsave)
 * - Parameters: id (fullname like t3_xxx for posts)
 * - Required scope: 'save'
 *
 * @example
 * fetch('/api/reddit/save', {
 *   method: 'POST',
 *   body: JSON.stringify({ id: 't3_abc123', save: true })
 * })
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

  // Rate limiting: Prevent save spam
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
    const {id, save} = body

    // Validate request body
    if (!id || typeof save !== 'boolean') {
      logError('Invalid save request: missing required fields', {
        component: 'saveApiRoute',
        action: 'validateRequest',
        body
      })
      return NextResponse.json(
        {error: 'Missing required fields: id and save'},
        {
          status: 400,
          headers: {
            'Cache-Control': 'no-store, max-age=0'
          }
        }
      )
    }

    // Validate id format (should be t3_xxx for posts)
    if (!id.startsWith('t3_')) {
      logError('Invalid save request: invalid id format', {
        component: 'saveApiRoute',
        action: 'validateRequest',
        id
      })
      return NextResponse.json(
        {error: 'Invalid id format. Must be a post id (t3_xxx)'},
        {
          status: 400,
          headers: {
            'Cache-Control': 'no-store, max-age=0'
          }
        }
      )
    }

    // Determine Reddit API endpoint based on save action
    const endpoint = save
      ? 'https://oauth.reddit.com/api/save'
      : 'https://oauth.reddit.com/api/unsave'

    // Call Reddit API to save/unsave post
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': config.userAgent
      },
      body: new URLSearchParams({
        id
      })
    })

    // Check if the request was successful
    if (!response.ok) {
      const errorText = await response.text()
      logError('Reddit API save request failed', {
        component: 'saveApiRoute',
        action: 'redditApiCall',
        status: response.status,
        statusText: response.statusText,
        errorText,
        id,
        saveAction: save,
        endpoint
      })

      // 403 typically means missing OAuth scope (save scope required)
      const errorMessage =
        response.status === 403
          ? 'Missing required permissions. Please log out and log back in to enable save functionality.'
          : 'Failed to save/unsave post'

      return NextResponse.json(
        {error: errorMessage},
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
        id,
        saved: save
      },
      {
        headers: {
          'Cache-Control': 'no-store, max-age=0'
        }
      }
    )
  } catch (error) {
    logError(error, {
      component: 'saveApiRoute',
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
