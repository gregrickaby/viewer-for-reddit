import config from '@/lib/config'
import {logError} from '@/lib/utils/logging/logError'
import {validateOrigin} from '@/lib/utils/validation/errors/validateOrigin'
import {isSafeRedditPath} from '@/lib/utils/validation/reddit/validateRedditPath'
import {NextRequest, NextResponse} from 'next/server'

/**
 * Common validation result for Reddit API requests.
 */
interface ValidationResult {
  isValid: boolean
  response?: NextResponse
  path?: string
}

/**
 * Validates a Reddit API proxy request (origin and path).
 *
 * This utility consolidates common validation logic used across all Reddit API route handlers:
 * 1. Origin validation (CSRF protection)
 * 2. Path parameter extraction
 * 3. Path safety validation (SSRF protection)
 *
 * @param request - The Next.js request object
 * @param componentName - Name of the component for logging (e.g., 'redditApiRoute')
 * @returns Validation result with isValid flag, optional error response, and extracted path
 *
 * @example
 * const validation = validateRedditRequest(request, 'redditApiRoute')
 * if (!validation.isValid) {
 *   return validation.response!
 * }
 * const path = validation.path!
 */
export function validateRedditRequest(
  request: NextRequest,
  componentName: string
): ValidationResult {
  // Validate request origin to prevent external abuse
  if (!validateOrigin(request)) {
    return {
      isValid: false,
      response: NextResponse.json({error: 'Forbidden'}, {status: 403})
    }
  }

  // Extract the Reddit API path from query parameters
  const {searchParams} = new URL(request.url)
  const path = searchParams.get('path')

  if (!path) {
    logError('Missing required path parameter', {
      component: componentName,
      action: 'validatePath',
      url: request.url,
      searchParams: Object.fromEntries(searchParams.entries())
    })
    return {
      isValid: false,
      response: NextResponse.json(
        {error: 'Path parameter is required'},
        {status: 400}
      )
    }
  }

  // Validate path to prevent SSRF and abuse
  if (!isSafeRedditPath(path)) {
    logError('Invalid or dangerous Reddit API path', {
      component: componentName,
      action: 'validatePath',
      path,
      url: request.url,
      searchParams: Object.fromEntries(searchParams.entries())
    })
    return {
      isValid: false,
      response: NextResponse.json(
        {error: 'Invalid path parameter'},
        {status: 400}
      )
    }
  }

  return {isValid: true, path}
}

/**
 * Executes a Reddit API request through oauth.reddit.com with proper headers.
 *
 * @param path - The Reddit API path to request
 * @param token - The bearer token (app token or user session token)
 * @param componentName - Name of the component for logging
 * @returns NextResponse with the Reddit API data or error
 *
 * @example
 * const token = await getRedditToken()
 * return await executeRedditRequest('/r/programming/hot.json', token.access_token, 'redditApiRoute')
 */
export async function executeRedditRequest(
  path: string,
  token: string,
  componentName: string
): Promise<NextResponse> {
  try {
    const response = await fetch(`https://oauth.reddit.com${path}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'User-Agent': config.userAgent
      }
    })

    if (!response.ok) {
      logError('Reddit API request failed', {
        component: componentName,
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
      return NextResponse.json(
        {error: 'Reddit API error'},
        {status: response.status}
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    logError('Reddit API request exception', {
      component: componentName,
      action: 'executeRequest',
      path,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
    return NextResponse.json({error: 'Internal server error'}, {status: 500})
  }
}
