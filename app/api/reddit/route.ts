import {getRedditToken} from '@/lib/actions/redditToken'
import {logError} from '@/lib/utils/logError'
import {NextRequest, NextResponse} from 'next/server'

// In-memory store for rate limiting.
const requestCounts = new Map<string, {count: number; resetTime: number}>()
const RATE_LIMIT = 60 // requests per minute
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute in milliseconds

/**
 * Check and update the rate limit for a given client ID.
 *
 * @param clientId - Unique identifier for the client (e.g., IP address)
 * @returns boolean - True if under the rate limit, false if exceeded
 */
function checkRateLimit(clientId: string): boolean {
  const now = Date.now()
  const clientData = requestCounts.get(clientId)

  if (!clientData || now > clientData.resetTime) {
    requestCounts.set(clientId, {count: 1, resetTime: now + RATE_LIMIT_WINDOW})
    return true
  }

  if (clientData.count >= RATE_LIMIT) {
    return false
  }

  clientData.count++
  return true
}

/**
 * Reddit API Proxy Route Handler
 *
 * @param request - The incoming Next.js request object
 * @returns Promise<NextResponse> - JSON response with Reddit API data or error
 *
 * @example
 * // Client-side usage:
 * fetch('/api/reddit?path=/r/programming/hot.json?limit=25')
 *
 * @see {@link https://www.reddit.com/dev/api/} Reddit API Documentation
 * @see {@link https://nextjs.org/docs/app/building-your-application/routing/route-handlers} Next.js Route Handlers
 */
export async function GET(request: NextRequest) {
  // Rate limiting by IP address.
  const clientId =
    request.headers.get('x-forwarded-for') ||
    request.headers.get('x-real-ip') ||
    'unknown'

  if (!checkRateLimit(clientId)) {
    return NextResponse.json(
      {error: 'Rate limit exceeded. Please try again later.'},
      {status: 429, headers: {'Retry-After': '60'}}
    )
  }

  // Extract the Reddit API path from query parameters
  const {searchParams} = new URL(request.url)
  const path = searchParams.get('path')

  // Validate required path parameter with security checks
  if (!path) {
    return NextResponse.json(
      {error: 'Path parameter is required'},
      {status: 400}
    )
  }

  // Ensure path starts with / and doesn't contain malicious patterns
  if (!path.startsWith('/') || path.includes('..') || path.includes('//')) {
    return NextResponse.json({error: 'Invalid path format'}, {status: 400})
  }

  // Ensure path matches Reddit API patterns
  const isValidRedditPath =
    (path.startsWith('/r/') && path.length > 3) || // Must have subreddit name after /r/
    (path.startsWith('/user/') && path.length > 6) || // Must have username after /user/
    path === '/api/subreddit_autocomplete_v2' ||
    path.startsWith('/api/subreddit_autocomplete_v2?') ||
    path === '/subreddits/popular.json' ||
    path.startsWith('/subreddits/popular.json?')

  if (!isValidRedditPath) {
    return NextResponse.json({error: 'Invalid Reddit API path'}, {status: 400})
  }

  try {
    // Retrieve the cached Reddit OAuth token from server action
    const token = await getRedditToken()

    // Ensure we have a valid access token before proceeding
    if (!token?.access_token) {
      return NextResponse.json(
        {error: 'No Reddit token available'},
        {status: 401}
      )
    }

    // Forward the request to Reddit's OAuth API with authentication
    const response = await fetch(`https://oauth.reddit.com${path}`, {
      headers: {
        // Include Bearer token for OAuth authentication
        Authorization: `Bearer ${token.access_token}`,
        // Required User-Agent as per Reddit API guidelines
        'User-Agent': 'Viewer for Reddit by /u/gregoryrickaby'
      }
    })

    // Handle Reddit API errors by forwarding the status and message
    if (!response.ok) {
      logError(
        `Reddit API error: ${response.status} ${response.statusText} for path: ${path}`,
        {
          component: 'redditApiRoute',
          action: 'proxyRequest',
          path,
          status: response.status,
          statusText: response.statusText,
          context: 'Reddit API returned error response'
        }
      )

      // Return specific error messages for common issues
      if (response.status === 429) {
        return NextResponse.json(
          {error: 'Reddit API rate limit exceeded. Please try again later.'},
          {
            status: 429,
            headers: {
              'Retry-After': response.headers.get('retry-after') || '60'
            }
          }
        )
      }

      if (response.status === 404) {
        return NextResponse.json(
          {error: 'The requested Reddit resource was not found.'},
          {status: 404}
        )
      }

      return NextResponse.json(
        {error: `Reddit API error: ${response.statusText}`},
        {status: response.status}
      )
    }

    // Parse the successful Reddit API response
    const data = await response.json()

    // Return the data with CORS headers to enable cross-origin requests
    return NextResponse.json(data, {
      headers: {
        'Access-Control-Allow-Origin':
          process.env.NODE_ENV === 'production'
            ? request.headers.get('origin') || 'https://reddit-viewer.com'
            : '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block'
      }
    })
  } catch (error) {
    logError(error, {
      component: 'redditApiRoute',
      action: 'proxyRequest',
      path,
      clientId,
      context: 'Unexpected error in Reddit API proxy'
    })
    return NextResponse.json({error: 'Internal server error'}, {status: 500})
  }
}
