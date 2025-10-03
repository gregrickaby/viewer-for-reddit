import {getSession} from '@/lib/auth/session'
import config from '@/lib/config'
import {logError} from '@/lib/utils/logError'
import {validateOrigin} from '@/lib/utils/validateOrigin'
import {NextRequest, NextResponse} from 'next/server'

/**
 * Vote API Route Handler.
 *
 * This endpoint handles upvote/downvote requests for posts and comments.
 * Requires user authentication and 'vote' OAuth scope.
 *
 * Reddit Vote API:
 * - Endpoint: POST /api/vote
 * - Parameters: id (fullname like t1_xxx or t3_xxx), dir (1=upvote, 0=unvote, -1=downvote)
 *
 * @example
 * fetch('/api/reddit/vote', {
 *   method: 'POST',
 *   body: JSON.stringify({ id: 't3_abc123', dir: 1 })
 * })
 *
 * @param {NextRequest} request - The incoming request object.
 */
export async function POST(request: NextRequest) {
  // Validate request origin to prevent external abuse
  if (!validateOrigin(request)) {
    return NextResponse.json({error: 'Forbidden'}, {status: 403})
  }

  try {
    // Parse request body
    const body = await request.json()
    const {id, dir} = body

    // Validate required parameters
    if (!id || typeof id !== 'string') {
      logError('Invalid vote request: missing or invalid id', {
        component: 'voteApiRoute',
        action: 'validateRequest',
        body
      })
      return NextResponse.json(
        {error: 'Invalid vote request: id is required and must be a string'},
        {status: 400}
      )
    }

    if (dir === undefined || ![1, 0, -1].includes(dir)) {
      logError('Invalid vote request: invalid dir value', {
        component: 'voteApiRoute',
        action: 'validateRequest',
        body
      })
      return NextResponse.json(
        {error: 'Invalid vote request: dir must be 1, 0, or -1'},
        {status: 400}
      )
    }

    // Validate id format (must be t1_xxx for comment or t3_xxx for post)
    const idPattern = /^t[13]_[a-z0-9]+$/i
    if (!idPattern.exec(id)) {
      logError('Invalid vote request: malformed id', {
        component: 'voteApiRoute',
        action: 'validateRequest',
        id
      })
      return NextResponse.json(
        {error: 'Invalid vote request: id must be in format t1_xxx or t3_xxx'},
        {status: 400}
      )
    }

    // Get user session token
    const session = await getSession()

    if (!session?.accessToken) {
      return NextResponse.json(
        {error: 'Authentication required'},
        {status: 401}
      )
    }

    // Prepare form data for Reddit API
    const formData = new URLSearchParams()
    formData.append('id', id)
    formData.append('dir', dir.toString())

    // Send vote request to Reddit
    const response = await fetch('https://oauth.reddit.com/api/vote', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        'User-Agent': config.userAgent,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData.toString()
    })

    if (!response.ok) {
      const errorText = await response.text()
      logError('Reddit vote API request failed', {
        component: 'voteApiRoute',
        action: 'submitVote',
        id,
        dir,
        status: response.status,
        statusText: response.statusText,
        errorText
      })

      return NextResponse.json(
        {error: 'Failed to submit vote to Reddit'},
        {status: response.status}
      )
    }

    // Reddit vote API returns empty JSON object {} on success
    return NextResponse.json({success: true})
  } catch (error) {
    logError(error, {
      component: 'voteApiRoute',
      action: 'handleRequest',
      url: request.url,
      method: request.method
    })
    return NextResponse.json({error: 'Internal server error'}, {status: 500})
  }
}
