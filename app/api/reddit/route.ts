import {getRedditToken} from '@/lib/actions/redditToken'
import config from '@/lib/config'
import {logError} from '@/lib/utils/logError'
import {NextRequest, NextResponse} from 'next/server'

/**
 * Validates that the request comes from an allowed origin.
 *
 * @param {NextRequest} request - The incoming request object.
 * @returns {boolean} True if the origin is allowed, false otherwise.
 */
function validateOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin')
  const referer = request.headers.get('referer')

  // In development, allow localhost.
  if (process.env.NODE_ENV === 'development') {
    if (origin?.includes('localhost') || referer?.includes('localhost')) {
      return true
    }
  }

  // In production, check against your domain.
  const productionUrl = process.env.PRODUCTION_URL
  if (productionUrl) {
    if (origin === productionUrl || referer?.startsWith(productionUrl)) {
      return true
    }
  }

  // Log blocked request with structured context
  logError('Request blocked due to invalid origin', {
    component: 'redditApiRoute',
    action: 'validateOrigin',
    origin: origin || 'none',
    referer: referer || 'none',
    nodeEnv: process.env.NODE_ENV,
    productionUrl: productionUrl || 'not-set'
  })
  return false
}

/**
 * Reddit API Proxy Route Handler.
 *
 * @example
 * fetch('/api/reddit?path=/r/programming/hot.json?limit=25')
 *
 * @param {NextRequest} request - The incoming request object.
 * @returns {Promise<NextResponse>} The response from the Reddit API or an error.
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
      component: 'redditApiRoute',
      action: 'validatePath',
      url: request.url,
      searchParams: Object.fromEntries(searchParams.entries())
    })
    return NextResponse.json(
      {error: 'Path parameter is required'},
      {status: 400}
    )
  }

  try {
    const token = await getRedditToken()

    if (!token?.access_token) {
      logError('Reddit token unavailable for API request', {
        component: 'redditApiRoute',
        action: 'validateToken',
        path,
        tokenExists: !!token,
        hasAccessToken: !!token?.access_token,
        tokenType: token?.token_type
      })
      return NextResponse.json(
        {error: 'No Reddit token available'},
        {status: 401}
      )
    }

    const response = await fetch(`https://oauth.reddit.com${path}`, {
      headers: {
        Authorization: `Bearer ${token.access_token}`,
        'User-Agent': config.userAgent
      }
    })

    if (!response.ok) {
      logError('Reddit API request failed', {
        component: 'redditApiRoute',
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
    logError(error, {
      component: 'redditApiRoute',
      action: 'proxyRequest',
      path,
      url: request.url,
      method: request.method,
      origin: request.headers.get('origin'),
      userAgent: request.headers.get('user-agent')
    })
    return NextResponse.json({error: 'Internal server error'}, {status: 500})
  }
}
