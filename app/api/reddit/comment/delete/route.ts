import {checkRateLimit} from '@/lib/auth/rateLimit'
import {getSession} from '@/lib/auth/session'
import config from '@/lib/config'
import {logError} from '@/lib/utils/logging/logError'
import {validateOrigin} from '@/lib/utils/validation/validateOrigin'
import {NextRequest, NextResponse} from 'next/server'

/**
 * Validates comment ID parameter.
 *
 * @param id - The fullname of the comment to delete
 * @returns Error response if invalid, null if valid
 */
function validateCommentId(id: unknown): NextResponse | null {
  if (!id || typeof id !== 'string') {
    logError('Invalid delete request: missing or invalid id', {
      component: 'commentDeleteApiRoute',
      action: 'validateRequest',
      id
    })
    return NextResponse.json(
      {error: 'Invalid delete request: id is required and must be a string'},
      {
        status: 400,
        headers: {'Cache-Control': 'no-store, max-age=0'}
      }
    )
  }

  // Validate comment ID format (t1_xxx for comments)
  const commentIdPattern = /^t1_[a-z0-9]+$/i
  if (!commentIdPattern.test(id)) {
    logError('Invalid delete request: malformed comment id', {
      component: 'commentDeleteApiRoute',
      action: 'validateRequest',
      id
    })
    return NextResponse.json(
      {error: 'Invalid delete request: id must be in format t1_xxx'},
      {
        status: 400,
        headers: {'Cache-Control': 'no-store, max-age=0'}
      }
    )
  }

  return null
}

/**
 * Handles Reddit API error responses.
 *
 * @param response - The fetch response from Reddit
 * @param id - The comment id from the request
 * @returns Error response
 */
async function handleRedditError(
  response: Response,
  id: string
): Promise<NextResponse> {
  const errorText = await response.text()
  logError('Reddit delete API request failed', {
    component: 'commentDeleteApiRoute',
    action: 'deleteComment',
    id,
    status: response.status,
    statusText: response.statusText,
    errorText
  })

  if (response.status === 403) {
    return NextResponse.json(
      {
        error: 'Missing required scope',
        scope_required: 'edit',
        message: 'Please log out and log back in to enable comment deletion'
      },
      {
        status: 403,
        headers: {'Cache-Control': 'no-store, max-age=0'}
      }
    )
  }

  if (response.status === 404) {
    return NextResponse.json(
      {error: 'Comment not found'},
      {
        status: 404,
        headers: {'Cache-Control': 'no-store, max-age=0'}
      }
    )
  }

  if (response.status === 429) {
    return NextResponse.json(
      {
        error: 'Rate limit exceeded',
        message:
          "You're deleting too quickly. Please wait a moment and try again."
      },
      {
        status: 429,
        headers: {'Cache-Control': 'no-store, max-age=0'}
      }
    )
  }

  return NextResponse.json(
    {error: 'Failed to delete comment'},
    {
      status: response.status,
      headers: {'Cache-Control': 'no-store, max-age=0'}
    }
  )
}

/**
 * Comment Deletion API Route Handler.
 *
 * This endpoint handles comment deletion requests for authenticated users.
 * Requires user authentication and 'edit' OAuth scope.
 *
 * Security measures:
 * - Origin validation (CSRF protection)
 * - Rate limiting (prevents abuse)
 * - Authentication required
 * - Input validation (comment ID format)
 * - Ownership validation (Reddit enforces server-side)
 *
 * Reddit Delete API:
 * - Endpoint: POST /api/del
 * - Parameters: id (fullname like t1_xxx for comments)
 *
 * @example
 * fetch('/api/reddit/comment/delete', {
 *   method: 'POST',
 *   body: JSON.stringify({ id: 't1_abc123' })
 * })
 *
 * @param {NextRequest} request - The incoming request object.
 */
export async function POST(request: NextRequest) {
  // Validate request origin to prevent external abuse
  if (!validateOrigin(request)) {
    return NextResponse.json(
      {error: 'Forbidden'},
      {
        status: 403,
        headers: {'Cache-Control': 'no-store, max-age=0'}
      }
    )
  }

  // Rate limiting: Prevent deletion spam
  const rateLimitResponse = await checkRateLimit(request)
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  try {
    // Parse request body
    const body = await request.json()
    const {id} = body

    // Validate request parameters
    const idError = validateCommentId(id)
    if (idError) {
      return idError
    }

    // Get user session token
    const session = await getSession()
    if (!session?.accessToken) {
      return NextResponse.json(
        {error: 'Authentication required'},
        {
          status: 401,
          headers: {'Cache-Control': 'no-store, max-age=0'}
        }
      )
    }

    // Prepare form data for Reddit API
    const formData = new URLSearchParams()
    formData.append('id', id)

    // Send delete request to Reddit
    const response = await fetch('https://oauth.reddit.com/api/del', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        'User-Agent': config.userAgent,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData.toString()
    })

    if (!response.ok) {
      return handleRedditError(response, id)
    }

    // Reddit's /api/del returns empty body on success
    return NextResponse.json(
      {success: true},
      {
        headers: {'Cache-Control': 'no-store, max-age=0'}
      }
    )
  } catch (error) {
    logError(error, {
      component: 'commentDeleteApiRoute',
      action: 'handleRequest',
      url: request.url,
      method: request.method
    })
    return NextResponse.json(
      {error: 'Internal server error'},
      {
        status: 500,
        headers: {'Cache-Control': 'no-store, max-age=0'}
      }
    )
  }
}
