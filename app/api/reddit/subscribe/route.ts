import {getSession} from '@/lib/auth/session'
import {logError} from '@/lib/utils/logError'
import {type NextRequest, NextResponse} from 'next/server'

/**
 * Subscribe or unsubscribe from a subreddit
 *
 * @see https://www.reddit.com/dev/api#POST_api_subscribe
 */
export async function POST(request: NextRequest) {
  try {
    // Get the session
    const session = await getSession()

    // Check if user is authenticated
    if (!session?.accessToken) {
      return NextResponse.json(
        {error: 'Unauthorized'},
        {
          status: 401
        }
      )
    }

    // Get the request body
    const body = await request.json()
    const {action, sr_name} = body

    // Validate request body
    if (!action || !sr_name) {
      logError('Invalid subscribe request: missing required fields', {
        component: 'subscribeApiRoute',
        action: 'validateRequest',
        body
      })
      return NextResponse.json(
        {error: 'Missing required fields: action and sr_name'},
        {
          status: 400
        }
      )
    }

    // Validate action value
    if (action !== 'sub' && action !== 'unsub') {
      logError('Invalid subscribe request: invalid action value', {
        component: 'subscribeApiRoute',
        action: 'validateRequest',
        body
      })
      return NextResponse.json(
        {error: 'Invalid action. Must be "sub" or "unsub"'},
        {
          status: 400
        }
      )
    }

    // Call Reddit API to subscribe/unsubscribe
    const response = await fetch('https://oauth.reddit.com/api/subscribe', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'web:reddit-viewer:v1.0.0'
      },
      body: new URLSearchParams({
        action,
        sr_name
      })
    })

    // Check if the request was successful
    if (!response.ok) {
      const errorText = await response.text()
      logError('Reddit API subscribe request failed', {
        component: 'subscribeApiRoute',
        action: 'redditApiCall',
        status: response.status,
        statusText: response.statusText,
        errorText,
        sr_name,
        actionType: action
      })
      return NextResponse.json(
        {error: 'Failed to update subscription'},
        {
          status: response.status
        }
      )
    }

    // Return success
    return NextResponse.json({
      success: true,
      action,
      sr_name
    })
  } catch (error) {
    logError(error, {
      component: 'subscribeApiRoute',
      action: 'handleRequest'
    })
    return NextResponse.json(
      {error: 'Internal server error'},
      {
        status: 500
      }
    )
  }
}
