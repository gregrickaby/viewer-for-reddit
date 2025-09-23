import {getRedditToken} from '@/lib/actions/redditToken'
import {NextRequest, NextResponse} from 'next/server'

/**
 * Reddit API Proxy Route Handler
 *
 * This route serves as a CORS proxy for the Reddit OAuth API, primarily designed
 * to solve CORS restrictions in iOS Safari browsers. It forwards requests to
 * the Reddit API with proper authentication and returns the response with
 * appropriate CORS headers.
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
  // Extract the Reddit API path from query parameters
  const {searchParams} = new URL(request.url)
  const path = searchParams.get('path')

  // Validate required path parameter
  if (!path) {
    return NextResponse.json(
      {error: 'Path parameter is required'},
      {status: 400}
    )
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
        // Allow requests from any origin (required for iOS Safari)
        'Access-Control-Allow-Origin': '*',
        // Only allow GET method for security
        'Access-Control-Allow-Methods': 'GET',
        // Allow Content-Type header in requests
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    })
  } catch (error) {
    // Log unexpected errors for debugging while protecting sensitive details
    console.error('Proxy error:', error)
    return NextResponse.json({error: 'Internal server error'}, {status: 500})
  }
}
