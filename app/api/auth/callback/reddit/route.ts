import {getSession} from '@/lib/auth/session'
import type {SessionData} from '@/lib/types/reddit'
import {getEnvVar} from '@/lib/utils/env'
import {logger} from '@/lib/utils/logger'
import {Reddit} from 'arctic'
import {NextRequest, NextResponse} from 'next/server'

/**
 * Reddit user data from /api/v1/me endpoint.
 */
interface RedditUserData {
  name: string
  id: string
}

/**
 * Reddit OAuth client instance.
 * Configured with Reddit app credentials.
 */
const reddit = new Reddit(
  getEnvVar('REDDIT_CLIENT_ID'),
  getEnvVar('REDDIT_CLIENT_SECRET'),
  getEnvVar('REDDIT_REDIRECT_URI')
)

/**
 * Fetches authenticated user data from Reddit API.
 *
 * @param accessToken - OAuth access token
 * @returns User data (username, user ID)
 * @throws Error if Reddit API request fails
 */
async function fetchUserData(accessToken: string): Promise<RedditUserData> {
  const userResponse = await fetch('https://oauth.reddit.com/api/v1/me', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'User-Agent': getEnvVar('USER_AGENT')
    }
  })

  if (!userResponse.ok) {
    const errorText = await userResponse.text()
    logger.error(
      'Reddit API error',
      {status: userResponse.status, errorText},
      {context: 'fetchUserData'}
    )
    throw new Error(`Reddit API responded with ${userResponse.status}`)
  }

  return userResponse.json()
}

/**
 * Validates OAuth code and fetches tokens and user data.
 *
 * @param code - OAuth authorization code from Reddit
 * @returns Session data with tokens, expiration, and user info
 * @throws Error if token validation or user data fetch fails
 */
async function handleTokens(code: string): Promise<SessionData> {
  const tokens = await reddit.validateAuthorizationCode(code)
  const accessToken = tokens.accessToken()

  let refreshToken = ''
  try {
    refreshToken = tokens.refreshToken() || ''
  } catch {
    logger.info('No refresh token provided by Reddit', undefined, {
      context: 'handleTokens'
    })
  }

  logger.debug(
    'Tokens received',
    {hasAccessToken: !!accessToken, hasRefreshToken: !!refreshToken},
    {context: 'handleTokens'}
  )

  const userData = await fetchUserData(accessToken)

  logger.info(
    'User authenticated',
    {username: userData.name},
    {context: 'handleTokens'}
  )

  return {
    accessToken,
    refreshToken,
    expiresAt: tokens.accessTokenExpiresAt()?.getTime() || Date.now() + 3600000,
    username: userData.name,
    userId: userData.id
  }
}

/**
 * GET handler for Reddit OAuth callback.
 * Validates OAuth state, exchanges code for tokens, stores session.
 *
 * Security measures:
 * - CSRF protection via state parameter validation
 * - Redirect URI validation
 * - Secure HTTP-only session cookies
 * - Error handling for various failure modes
 *
 * Flow:
 * 1. Validate state parameter (CSRF protection)
 * 2. Validate redirect URI matches configuration
 * 3. Exchange authorization code for access/refresh tokens
 * 4. Fetch user data from Reddit API
 * 5. Store session data in encrypted cookie
 * 6. Redirect to homepage
 *
 * @param request - Next.js request object
 * @returns Redirect to homepage on success, error response on failure
 *
 * @example
 * ```typescript
 * // Reddit redirects to /api/auth/callback/reddit?code=xxx&state=yyy
 * // Handler validates, exchanges code for tokens, saves session
 * // Redirects to homepage with authenticated session
 * ```
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const error = url.searchParams.get('error')
  const storedState = request.cookies.get('reddit_oauth_state')?.value

  logger.debug(
    'OAuth Callback',
    {code: !!code, state: !!state, storedState: !!storedState, error},
    {context: 'OAuth'}
  )

  // Handle OAuth error from Reddit
  if (error) {
    logger.error(
      'OAuth error from Reddit',
      {error, description: url.searchParams.get('error_description')},
      {context: 'OAuth'}
    )
    return NextResponse.redirect(
      new URL(`/?error=${encodeURIComponent(error)}`, request.url)
    )
  }

  // Validate state to prevent CSRF attacks
  if (!code || !state || !storedState || state !== storedState) {
    logger.error(
      'State validation failed - possible CSRF attack',
      {
        state: !!state,
        storedState: !!storedState,
        statesMatch: state === storedState
      },
      {context: 'OAuth'}
    )
    return new NextResponse('Invalid state parameter', {status: 400})
  }

  // Validate redirect URI matches configuration
  const configuredRedirectUri = getEnvVar('REDDIT_REDIRECT_URI')
  const callbackUrl = new URL(request.url)
  callbackUrl.search = ''

  if (callbackUrl.toString() !== configuredRedirectUri) {
    logger.error(
      'Redirect URI mismatch - possible attack',
      {callback: callbackUrl.toString(), configured: configuredRedirectUri},
      {context: 'OAuth'}
    )
    return new NextResponse('Invalid redirect URI', {status: 400})
  }

  try {
    const sessionData = await handleTokens(code)

    const session = await getSession()
    session.accessToken = sessionData.accessToken
    session.refreshToken = sessionData.refreshToken
    session.expiresAt = sessionData.expiresAt
    session.username = sessionData.username
    session.userId = sessionData.userId
    await session.save()

    // Build clean redirect URL without hash fragment
    const redirectUrl = new URL('/', request.url)
    redirectUrl.hash = '' // Remove hash fragment (Reddit adds #_)

    const response = NextResponse.redirect(redirectUrl)
    response.cookies.delete('reddit_oauth_state')

    return response
  } catch (error) {
    logger.error('OAuth authentication failed', error, {
      context: 'OAuthCallback'
    })

    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'

    // Return specific status codes based on error type
    if (errorMessage.includes('401') || errorMessage.includes('unauthorized')) {
      return new NextResponse('Authentication expired', {status: 401})
    }
    if (errorMessage.includes('429') || errorMessage.includes('rate limit')) {
      return new NextResponse('Rate limit exceeded', {status: 429})
    }
    if (errorMessage.includes('503') || errorMessage.includes('unavailable')) {
      return new NextResponse('Reddit API unavailable', {status: 503})
    }

    return new NextResponse(`Authentication failed: ${errorMessage}`, {
      status: 500
    })
  }
}
