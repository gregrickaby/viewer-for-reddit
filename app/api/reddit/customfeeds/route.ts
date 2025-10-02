import {getSession} from '@/lib/auth/session'
import config from '@/lib/config'
import {logError} from '@/lib/utils/logError'
import {validateOrigin} from '@/lib/utils/validateOrigin'
import {isSafeRedditPath} from '@/lib/utils/validateRedditPath'
import {NextRequest, NextResponse} from 'next/server'

/**
 * Reddit Custom Feeds Authenticated API Proxy Route Handler.
 *
 * Handles user-authenticated custom feeds API requests using session tokens.
 * Note: Custom feeds endpoint requires username in the path.
 *
 * @example
 * fetch('/api/reddit/customfeeds?username=testuser')
 */
export async function GET(request: NextRequest) {
  // Validate request origin
  if (!validateOrigin(request)) {
    return NextResponse.json({error: 'Forbidden'}, {status: 403})
  }

  try {
    const session = await getSession()

    // Not authenticated - return empty array (graceful degradation)
    if (!session?.accessToken || !session?.username) {
      return NextResponse.json([])
    }

    // Build path - Reddit's multi API endpoint for authenticated user
    const path = `/api/multi/mine.json`

    // Validate path
    if (!isSafeRedditPath(path)) {
      logError('Invalid custom feeds path', {
        component: 'redditCustomFeedsRoute',
        action: 'validatePath',
        path
      })
      return NextResponse.json([])
    }

    const response = await fetch(`https://oauth.reddit.com${path}`, {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        'User-Agent': config.userAgent
      }
    })

    if (!response.ok) {
      logError('Reddit custom feeds API request failed', {
        component: 'redditCustomFeedsRoute',
        action: 'fetchRedditApi',
        path,
        status: response.status,
        statusText: response.statusText
      })
      return NextResponse.json([])
    }

    const data = await response.json()

    // Reddit's /api/multi/mine.json returns an array directly, not wrapped in data.children
    // Each item in the array is a multireddit object with data property
    const customFeeds = Array.isArray(data)
      ? data.map((item: any) => {
          // Reddit returns path like "/user/username/m/customFeedName/"
          // Remove trailing slash for consistency with Next.js routing
          const path = item.data?.path?.replace(/\/$/, '') || ''

          return {
            name: item.data?.name || '',
            display_name: item.data?.display_name || item.data?.name || '',
            path,
            icon_url: item.data?.icon_url || '',
            subreddits: item.data?.subreddits?.map((sub: any) => sub.name) || []
          }
        })
      : []

    return NextResponse.json(customFeeds)
  } catch (error) {
    logError('Unexpected error in custom feeds API proxy', {
      component: 'redditCustomFeedsRoute',
      action: 'handleRequest',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
    return NextResponse.json([])
  }
}
