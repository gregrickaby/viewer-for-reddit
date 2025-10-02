import {getSession} from '@/lib/auth/session'
import config from '@/lib/config'
import {logError} from '@/lib/utils/logError'
import {validateOrigin} from '@/lib/utils/validateOrigin'
import {isSafeRedditPath} from '@/lib/utils/validateRedditPath'
import {NextRequest, NextResponse} from 'next/server'

/**
 * Reddit Authenticated API Proxy Route Handler.
 *
 * Handles user-authenticated Reddit API requests using session tokens.
 * Similar to /api/reddit but uses user session instead of app-level tokens.
 *
 * @example
 * fetch('/api/reddit/subscriptions?path=/subreddits/mine/subscriber')
 */
export async function GET(request: NextRequest) {
  // Validate request origin
  if (!validateOrigin(request)) {
    return NextResponse.json({error: 'Forbidden'}, {status: 403})
  }

  // Extract the Reddit API path from query parameters
  const {searchParams} = new URL(request.url)
  const path = searchParams.get('path')

  if (!path) {
    logError('Missing required path parameter', {
      component: 'redditAuthApiRoute',
      action: 'validatePath',
      url: request.url
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
      component: 'redditAuthApiRoute',
      action: 'validatePath',
      path
    })
    return NextResponse.json({error: 'Invalid path parameter'}, {status: 400})
  }

  try {
    const session = await getSession()

    // Not authenticated - return empty response (graceful degradation)
    if (!session?.accessToken) {
      return NextResponse.json({data: {children: []}})
    }

    // Safe to use user-provided path - validated by isSafeRedditPath() above
    const response = await fetch(`https://oauth.reddit.com${path}`, {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        'User-Agent': config.userAgent
      }
    })

    if (!response.ok) {
      logError('Reddit authenticated API request failed', {
        component: 'redditAuthApiRoute',
        action: 'fetchRedditApi',
        path,
        status: response.status,
        statusText: response.statusText
      })
      // Return empty response for graceful degradation
      return NextResponse.json({data: {children: []}})
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    logError('Unexpected error in authenticated Reddit API proxy', {
      component: 'redditAuthApiRoute',
      action: 'handleRequest',
      path,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
    // Return empty response for graceful degradation
    return NextResponse.json({data: {children: []}})
  }
}
