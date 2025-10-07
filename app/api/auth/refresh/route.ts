import {getRedditClient} from '@/lib/auth/arctic'
import {getClientInfo, logAuditEvent} from '@/lib/auth/auditLog'
import {checkRateLimit} from '@/lib/auth/rateLimit'
import {getSession, updateSessionTokens} from '@/lib/auth/session'
import {logError} from '@/lib/utils/logging/logError'
import {NextRequest, NextResponse} from 'next/server'

/**
 * OAuth 2.0 token refresh handler.
 *
 * Automatically refreshes the Reddit OAuth access token using the refresh token
 * stored in the encrypted session cookie. This is called when the access token
 * is expiring soon (within 5 minutes) to maintain continuous authentication.
 *
 * @security
 * - Rate limiting applied to prevent token refresh abuse
 * - Validates session and refresh token existence
 * - Audit logging for security monitoring
 * - Error logging without exposing sensitive details
 * - Cache prevention headers on all responses
 * - Session remains encrypted in httpOnly cookie
 *
 * @flow
 * 1. Client detects token expiring soon (via session endpoint)
 * 2. Client calls POST /api/auth/refresh
 * 3. This route validates session and refresh token
 * 4. Exchanges refresh token with Reddit for new access token
 * 5. Updates encrypted session cookie with new tokens
 * 6. Returns new expiration time to client
 *
 * @remarks
 * - Reddit may or may not return a new refresh token
 * - If new refresh token provided, it replaces the old one
 * - If refresh fails, user must re-authenticate via login flow
 * - Refresh tokens are single-use in some OAuth implementations
 *
 * @param request - Next.js request object (for rate limiting and audit logging)
 * @returns Success response with new expiry time or error response
 */
export async function POST(request: NextRequest) {
  // Apply rate limiting to prevent token refresh abuse
  const rateLimitResponse = await checkRateLimit(request)
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  try {
    const session = await getSession()

    // Validate session exists and has refresh token
    if (!session?.refreshToken) {
      // Log failed refresh attempt for security monitoring
      logAuditEvent({
        type: 'token_refresh_failed',
        username: session?.username,
        ...getClientInfo(request)
      })

      return NextResponse.json(
        {error: 'no_session', message: 'No active session or refresh token'},
        {status: 401}
      )
    }

    // Exchange refresh token for new access token via Reddit API
    const reddit = getRedditClient()
    const tokens = await reddit.refreshAccessToken(session.refreshToken)

    // Update session with new tokens (refresh token may be rotated)
    await updateSessionTokens({
      accessToken: tokens.accessToken(),
      refreshToken: tokens.hasRefreshToken()
        ? tokens.refreshToken()
        : undefined,
      expiresAt: tokens.accessTokenExpiresAt().getTime()
    })

    // Audit log successful token refresh
    logAuditEvent({
      type: 'token_refresh_success',
      username: session.username,
      ...getClientInfo(request)
    })

    const response = NextResponse.json({
      success: true,
      expiresAt: tokens.accessTokenExpiresAt().getTime()
    })

    // Prevent caching by CDN/proxies
    response.headers.set(
      'Cache-Control',
      'private, no-cache, no-store, must-revalidate'
    )
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')

    return response
  } catch (error) {
    // Get session for logging context (may be null if error occurred early)
    const session = await getSession().catch(() => null)

    // Log error for debugging without exposing sensitive details
    logError(error, {
      component: 'RefreshRoute',
      action: 'refreshToken',
      username: session?.username,
      ...getClientInfo(request)
    })

    // Audit log failed refresh attempt
    logAuditEvent({
      type: 'token_refresh_failed',
      username: session?.username,
      ...getClientInfo(request)
    })

    const errorResponse = NextResponse.json(
      {error: 'refresh_failed', message: 'Failed to refresh token'},
      {status: 401}
    )

    // Prevent caching by CDN/proxies
    errorResponse.headers.set(
      'Cache-Control',
      'private, no-cache, no-store, must-revalidate'
    )
    errorResponse.headers.set('Pragma', 'no-cache')
    errorResponse.headers.set('Expires', '0')

    return errorResponse
  }
}
