import {checkRateLimit} from '@/lib/auth/rateLimit'
import {logError} from '@/lib/utils/logging/logError'
import {validateOrigin} from '@/lib/utils/validation/validateOrigin'
import {isSafeRedditPath} from '@/lib/utils/validation/validateRedditPath'
import {NextRequest, NextResponse} from 'next/server'

/**
 * Result of request validation containing either the validated path or an error response.
 */
export interface ValidationResult {
  path: string | null
  error: NextResponse | null
}

/**
 * Performs all security validations for Reddit API routes.
 *
 * Validations performed:
 * 1. Origin validation (CSRF protection)
 * 2. Rate limiting (DoS protection)
 * 3. Path extraction
 * 4. Path validation (SSRF protection)
 *
 * @param request - The incoming Next.js request
 * @param component - Component name for logging (e.g., 'redditApiRoute')
 * @returns ValidationResult with path (if valid) or error response
 *
 * @example
 * const {path, error} = await validateRedditRequest(request, 'redditApiRoute')
 * if (error) return error
 * // Use validated path safely
 */
export async function validateRedditRequest(
  request: NextRequest,
  component: string
): Promise<ValidationResult> {
  // Origin validation - prevent external abuse
  if (!validateOrigin(request)) {
    return {
      path: null,
      error: createErrorResponse(403, 'Forbidden')
    }
  }

  // Rate limiting - prevent DoS attacks
  const rateLimitResponse = await checkRateLimit(request)
  if (rateLimitResponse) {
    return {path: null, error: rateLimitResponse}
  }

  // Extract path from query parameters
  const {searchParams} = new URL(request.url)
  const path = searchParams.get('path')

  if (!path) {
    logError('Missing required path parameter', {
      component,
      action: 'validatePath',
      url: request.url,
      searchParams: Object.fromEntries(searchParams.entries())
    })
    return {
      path: null,
      error: createErrorResponse(400, 'Path parameter is required')
    }
  }

  // Validate path - prevent SSRF and abuse
  if (!isSafeRedditPath(path)) {
    logError('Invalid or dangerous Reddit API path', {
      component,
      action: 'validatePath',
      path,
      url: request.url,
      searchParams: Object.fromEntries(searchParams.entries())
    })
    return {
      path: null,
      error: createErrorResponse(400, 'Invalid path parameter')
    }
  }

  return {path, error: null}
}

/**
 * Creates a standardized error response with no-cache headers.
 *
 * All error responses should not be cached to prevent caching of
 * temporary errors or security-related responses.
 *
 * @param status - HTTP status code (400, 403, 404, 500, etc.)
 * @param error - Error message to return
 * @returns NextResponse with error body and cache headers
 */
export function createErrorResponse(
  status: number,
  error: string
): NextResponse {
  return NextResponse.json(
    {error},
    {
      status,
      headers: {
        'Cache-Control': 'no-store, max-age=0'
      }
    }
  )
}

/**
 * Determines cache max-age for anonymous Reddit API requests.
 *
 * More static content gets longer cache durations to reduce API calls.
 *
 * @param path - Reddit API path
 * @returns Cache max-age in seconds
 */
export function getAnonymousCacheMaxAge(path: string): number {
  if (path.includes('/comments/')) {
    return 0 // No cache - comments need real-time updates after posting/deleting
  }
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
 * Determines cache max-age for authenticated Reddit API requests.
 *
 * User-specific content generally needs shorter cache durations.
 *
 * @param path - Reddit API path
 * @returns Cache max-age in seconds
 */
export function getAuthenticatedCacheMaxAge(path: string): number {
  // Comments need real-time updates after posting/deleting
  if (path.includes('/comments/')) {
    return 0
  }
  // Vote/subscribe actions should not be cached
  if (path.includes('/api/vote') || path.includes('/api/subscribe')) {
    return 0
  }
  // User's own feed/subscriptions change frequently
  if (path.includes('/api/v1/me') || path.includes('mine/subscriber')) {
    return 60 // 1 minute
  }
  // Custom feeds are relatively static
  if (path.includes('/m/')) {
    return 300 // 5 minutes
  }
  // Hot/popular posts for logged-in users
  if (path.includes('/hot.json') || path.includes('/popular')) {
    return 180 // 3 minutes
  }
  return 120 // 2 minutes default for authenticated content
}
