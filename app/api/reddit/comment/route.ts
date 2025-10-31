import {checkRateLimit} from '@/lib/auth/rateLimit'
import {getSession} from '@/lib/auth/session'
import config from '@/lib/config'
import {logError} from '@/lib/utils/logging/logError'
import {sanitizeText} from '@/lib/utils/validation/sanitizeText'
import {validateOrigin} from '@/lib/utils/validation/validateOrigin'
import {NextRequest, NextResponse} from 'next/server'

/**
 * Validates comment request parameters.
 *
 * @param thing_id - The fullname of the parent thing
 * @param text - The comment text
 * @returns Error response if invalid, null if valid
 */
function validateCommentParams(
  thing_id: unknown,
  text: unknown
): NextResponse | null {
  if (!thing_id || typeof thing_id !== 'string') {
    logError('Invalid comment request: missing or invalid thing_id', {
      component: 'commentApiRoute',
      action: 'validateRequest',
      thing_id
    })
    return NextResponse.json(
      {
        error:
          'Invalid comment request: thing_id is required and must be a string'
      },
      {
        status: 400,
        headers: {'Cache-Control': 'no-store, max-age=0'}
      }
    )
  }

  if (!text || typeof text !== 'string') {
    logError('Invalid comment request: missing or invalid text', {
      component: 'commentApiRoute',
      action: 'validateRequest',
      text
    })
    return NextResponse.json(
      {error: 'Invalid comment request: text is required and must be a string'},
      {
        status: 400,
        headers: {'Cache-Control': 'no-store, max-age=0'}
      }
    )
  }

  const thingIdPattern = /^t[13]_[a-z0-9]+$/i
  if (!thingIdPattern.test(thing_id)) {
    logError('Invalid comment request: malformed thing_id', {
      component: 'commentApiRoute',
      action: 'validateRequest',
      thing_id
    })
    return NextResponse.json(
      {
        error:
          'Invalid comment request: thing_id must be in format t1_xxx or t3_xxx'
      },
      {
        status: 400,
        headers: {'Cache-Control': 'no-store, max-age=0'}
      }
    )
  }

  return null
}

/**
 * Validates sanitized text content.
 *
 * @param sanitizedText - The sanitized text to validate
 * @returns Error response if invalid, null if valid
 */
function validateTextContent(sanitizedText: string): NextResponse | null {
  if (!sanitizedText) {
    return NextResponse.json(
      {error: 'Comment text cannot be empty'},
      {
        status: 400,
        headers: {'Cache-Control': 'no-store, max-age=0'}
      }
    )
  }

  if (sanitizedText.length > 10000) {
    return NextResponse.json(
      {error: 'Comment exceeds maximum length of 10,000 characters'},
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
 * @param thing_id - The thing_id from the request
 * @returns Error response
 */
async function handleRedditError(
  response: Response,
  thing_id: string
): Promise<NextResponse> {
  const errorText = await response.text()
  logError('Reddit comment API request failed', {
    component: 'commentApiRoute',
    action: 'submitComment',
    thing_id,
    status: response.status,
    statusText: response.statusText,
    errorText
  })

  if (response.status === 403) {
    return NextResponse.json(
      {
        error: 'Missing required scope',
        scope_required: 'submit',
        message: 'Please log out and log back in to enable comment replies'
      },
      {
        status: 403,
        headers: {'Cache-Control': 'no-store, max-age=0'}
      }
    )
  }

  if (response.status === 429) {
    return NextResponse.json(
      {
        error: 'Rate limit exceeded',
        message:
          "You're commenting too quickly. Please wait a moment and try again."
      },
      {
        status: 429,
        headers: {'Cache-Control': 'no-store, max-age=0'}
      }
    )
  }

  return NextResponse.json(
    {error: 'Failed to submit comment to Reddit'},
    {
      status: response.status,
      headers: {'Cache-Control': 'no-store, max-age=0'}
    }
  )
}

/**
 * Comment Submission API Route Handler.
 *
 * This endpoint handles comment submission requests for authenticated users.
 * Requires user authentication and 'submit' OAuth scope.
 *
 * Security measures:
 * - Origin validation (CSRF protection)
 * - Rate limiting (prevents spam)
 * - Authentication required
 * - Input validation (thing_id format, text content)
 * - Text sanitization (prevent XSS)
 *
 * Reddit Comment API:
 * - Endpoint: POST /api/comment
 * - Parameters: thing_id (fullname like t1_xxx or t3_xxx), text (raw markdown), api_type (json)
 *
 * @example
 * fetch('/api/reddit/comment', {
 *   method: 'POST',
 *   body: JSON.stringify({ thing_id: 't1_abc123', text: 'My reply' })
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

  // Rate limiting: Prevent comment spam
  const rateLimitResponse = await checkRateLimit(request)
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  try {
    // Parse request body
    const body = await request.json()
    const {thing_id, text} = body

    // Validate request parameters
    const paramsError = validateCommentParams(thing_id, text)
    if (paramsError) {
      return paramsError
    }

    // Sanitize and validate text content
    const sanitizedText = sanitizeText(text).trim()
    const textError = validateTextContent(sanitizedText)
    if (textError) {
      return textError
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
    formData.append('thing_id', thing_id)
    formData.append('text', sanitizedText)
    formData.append('api_type', 'json')

    // Send comment request to Reddit
    const response = await fetch('https://oauth.reddit.com/api/comment', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        'User-Agent': config.userAgent,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData.toString()
    })

    if (!response.ok) {
      return handleRedditError(response, thing_id)
    }

    // Parse Reddit API response
    const data = await response.json()

    // Reddit returns {json: {errors: [], data: {things: [...]}}}
    // Error format: [[errorType, errorMessage, errorField], ...]
    if (data.json?.errors?.length > 0) {
      const errorMessage = data.json.errors[0][1] || 'Unknown error'
      logError('Reddit API returned errors', {
        component: 'commentApiRoute',
        action: 'submitComment',
        errors: data.json.errors
      })
      return NextResponse.json(
        {error: errorMessage},
        {
          status: 400,
          headers: {'Cache-Control': 'no-store, max-age=0'}
        }
      )
    }

    // Extract comment data from response
    const commentData = data.json?.data?.things?.[0]?.data

    return NextResponse.json(
      {
        success: true,
        comment: commentData
          ? {
              id: commentData.id,
              name: commentData.name,
              body: commentData.body,
              author: commentData.author,
              created_utc: commentData.created_utc
            }
          : undefined
      },
      {
        headers: {'Cache-Control': 'no-store, max-age=0'}
      }
    )
  } catch (error) {
    logError(error, {
      component: 'commentApiRoute',
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
