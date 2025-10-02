import {getSession} from '@/lib/auth/session'
import config from '@/lib/config'
import {logError} from '@/lib/utils/logError'
import {validateOrigin} from '@/lib/utils/validateOrigin'
import {isSafeRedditPath} from '@/lib/utils/validateRedditPath'
import {NextRequest, NextResponse} from 'next/server'

/**
 * User-Authenticated Reddit API Proxy Route Handler (/me).
 *
 * This endpoint handles requests that require user authentication (user session tokens).
 * The "/me" convention follows REST patterns and mirrors Reddit's own /api/v1/me/* endpoints.
 *
 * Use this for user-specific resources:
 * - Custom Feeds (/user/{username}/m/{customFeedName})
 * - User home feed (/api/v1/me)
 * - Voting (/api/vote)
 * - Subscriptions (/subreddits/mine/subscriber)
 * - Saved posts (/user/{username}/saved)
 * - User preferences (/api/v1/me/prefs)
 *
 * Anonymous/read-only requests should use /api/reddit instead.
 *
 * @example
 * fetch('/api/reddit/me?path=/user/baxuche/m/one/hot.json')
 *
 * @param {NextRequest} request - The incoming request object.
 */
export async function GET(request: NextRequest) {
  // Validate request origin to prevent external abuse
  if (!validateOrigin(request)) {
    return NextResponse.json({error: 'Forbidden'}, {status: 403})
  }

  // Extract the Reddit API path from query parameters
  const {searchParams} = new URL(request.url)
  const path = searchParams.get('path')

  if (!path) {
    logError('Missing required path parameter', {
      component: 'redditMeApiRoute',
      action: 'validatePath',
      url: request.url,
      searchParams: Object.fromEntries(searchParams.entries())
    })
    return NextResponse.json(
      {error: 'Path parameter is required'},
      {status: 400}
    )
  }

  // Validate path to prevent SSRF and abuse
  // Note: CodeQL SSRF warning is a false positive - isSafeRedditPath() validates
  // all paths against allowed patterns before constructing the URL
  if (!isSafeRedditPath(path)) {
    logError('Invalid or dangerous Reddit API path', {
      component: 'redditMeApiRoute',
      action: 'validatePath',
      path,
      url: request.url,
      searchParams: Object.fromEntries(searchParams.entries())
    })
    return NextResponse.json({error: 'Invalid path parameter'}, {status: 400})
  }

  try {
    // Get user session token
    const session = await getSession()

    if (!session?.accessToken) {
      return NextResponse.json(
        {error: 'Authentication required'},
        {status: 401}
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
      logError('Reddit /me API request failed', {
        component: 'redditMeApiRoute',
        action: 'fetchReddit',
        path,
        status: response.status,
        statusText: response.statusText
      })
      return NextResponse.json(
        {error: 'Reddit API error'},
        {status: response.status}
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    logError('Reddit /me API proxy error', {
      component: 'redditMeApiRoute',
      action: 'proxyRequest',
      path,
      error
    })
    return NextResponse.json({error: 'Internal server error'}, {status: 500})
  }
}
