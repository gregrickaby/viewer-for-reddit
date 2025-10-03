import {getRedditClient} from '@/lib/auth/arctic'
import {checkRateLimit} from '@/lib/auth/rateLimit'
import {setSession} from '@/lib/auth/session'
import appConfig from '@/lib/config'
import {fetchWithTimeout} from '@/lib/utils/fetchWithTimeout'
import {
  cleanupOAuthCookies,
  extractRefreshToken
} from '@/lib/utils/oauthHelpers'
import {
  extractAvatarUrl,
  validateRedditUser,
  type RedditUserResponse
} from '@/lib/utils/redditUserValidator'
import {createUncachedRedirect} from '@/lib/utils/redirectHelpers'
import {OAuth2RequestError} from 'arctic'
import {cookies} from 'next/headers'
import {NextRequest} from 'next/server'

/**
 * OAuth error message constants for consistent user-facing errors.
 */
const OAUTH_ERRORS = {
  INVALID_STATE: {
    code: 'invalid_state',
    message: 'Security validation failed. Please try signing in again.'
  },
  OAUTH_ERROR: {
    code: 'oauth_error',
    message: 'Authentication failed. Please try again.'
  },
  AUTH_FAILED: {
    code: 'authentication_failed',
    message: 'Unable to complete sign in.'
  }
} as const

/**
 * Fetch Reddit user profile with timeout protection.
 *
 * @param accessToken - OAuth access token
 * @returns Reddit user profile data
 * @throws {Error} On timeout, network error, or invalid response
 */
async function fetchRedditUserWithTimeout(
  accessToken: string
): Promise<RedditUserResponse> {
  const response = await fetchWithTimeout(
    'https://oauth.reddit.com/api/v1/me',
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'User-Agent': appConfig.userAgent
      }
    }
  )

  if (!response.ok) {
    throw new Error(`Reddit API returned ${response.status}`)
  }

  const userData = await response.json()
  return validateRedditUser(userData)
}

/**
 * OAuth 2.0 callback handler for Reddit authentication.
 *
 * Handles the OAuth redirect from Reddit after user authorization.
 * Validates CSRF token, exchanges authorization code for access tokens,
 * fetches user profile, and establishes encrypted session.
 *
 * @security
 * - CSRF protection via state parameter validation
 * - Rate limiting applied before processing
 * - Comprehensive audit logging for security events
 * - Session data encrypted with iron-session
 * - Cache-Control headers prevent sensitive data caching
 * - Request timeout protection (10s)
 * - Input validation for all external data
 * - Error message sanitization prevents token leakage
 *
 * @flow
 * 1. Apply rate limiting
 * 2. Verify CSRF state parameter
 * 3. Exchange authorization code for tokens
 * 4. Fetch user profile from Reddit API (with timeout)
 * 5. Validate user data
 * 6. Create encrypted session cookie
 * 7. Cleanup OAuth state cookies
 * 8. Redirect to homepage
 *
 * @param request - Next.js request object with OAuth callback parameters
 * @returns Redirect response to homepage or error page
 */
export async function GET(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResponse = await checkRateLimit(request)
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')

  const cookieStore = await cookies()
  const storedState = cookieStore.get('reddit_oauth_state')?.value

  // Verify state to prevent CSRF attacks
  if (!code || !state || !storedState || state !== storedState) {
    const {logAuditEvent, getClientInfo} = await import('@/lib/auth/auditLog')

    logAuditEvent({
      type: 'csrf_validation_failed',
      ...getClientInfo(request),
      metadata: {
        hasCode: !!code,
        hasState: !!state,
        hasStoredState: !!storedState
      }
    })

    return createUncachedRedirect(
      new URL(
        `/?error=${OAUTH_ERRORS.INVALID_STATE.code}&message=${OAUTH_ERRORS.INVALID_STATE.message}`,
        appConfig.baseUrl
      )
    )
  }

  try {
    // Exchange code for tokens
    const reddit = getRedditClient()
    const tokens = await reddit.validateAuthorizationCode(code)

    // Fetch user info with timeout protection
    const user = await fetchRedditUserWithTimeout(tokens.accessToken())

    // Extract and validate avatar URL
    const avatarUrl = extractAvatarUrl(user)

    // Safely extract refresh token (may not always be provided)
    const refreshToken = await extractRefreshToken(tokens, user.name)

    // Create encrypted session
    await setSession({
      username: user.name,
      accessToken: tokens.accessToken(),
      refreshToken,
      expiresAt: tokens.accessTokenExpiresAt().getTime(),
      avatarUrl
    })

    // Clean up OAuth cookies
    await cleanupOAuthCookies(cookieStore)

    // Audit log success
    const {logAuditEvent, getClientInfo} = await import('@/lib/auth/auditLog')
    logAuditEvent({
      type: 'login_success',
      username: user.name,
      ...getClientInfo(request)
    })

    return createUncachedRedirect(new URL('/', appConfig.baseUrl))
  } catch (error) {
    const {logAuditEvent, getClientInfo} = await import('@/lib/auth/auditLog')
    const errorId = crypto.randomUUID()

    // logAuditEvent uses logError internally, which handles all error types automatically
    logAuditEvent({
      type: 'login_failed',
      ...getClientInfo(request),
      metadata: {
        errorId,
        error
      }
    })

    if (error instanceof OAuth2RequestError) {
      return createUncachedRedirect(
        new URL(
          `/?error=${OAUTH_ERRORS.OAUTH_ERROR.code}&message=${OAUTH_ERRORS.OAUTH_ERROR.message}&error_id=${errorId}`,
          appConfig.baseUrl
        )
      )
    }

    return createUncachedRedirect(
      new URL(
        `/?error=${OAUTH_ERRORS.AUTH_FAILED.code}&message=${OAUTH_ERRORS.AUTH_FAILED.message}&error_id=${errorId}`,
        appConfig.baseUrl
      )
    )
  }
}
