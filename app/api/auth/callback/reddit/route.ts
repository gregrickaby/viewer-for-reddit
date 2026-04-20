import {processOAuthCallback} from '@/lib/auth/processOAuthCallback'
import {persistSession} from '@/lib/auth/session'
import {logger} from '@/lib/axiom/server'
import {getEnvVar} from '@/lib/utils/env'
import {NextRequest, NextResponse} from 'next/server'
import {timingSafeEqual} from 'node:crypto'

/**
 * Resolves the host and protocol from request headers.
 * Handles reverse proxies by checking x-forwarded-* headers.
 *
 * @param request - Next.js request object
 * @returns Object with protocol and host
 */
function resolveHostFromRequest(request: NextRequest): {
  protocol: string
  host: string
} {
  const forwardedHost = request.headers.get('x-forwarded-host')
  const directHost = request.headers.get('host')
  const host = forwardedHost || directHost || new URL(request.url).host
  const protocol = request.headers.get('x-forwarded-proto') || 'https'

  if (!forwardedHost && !directHost) {
    logger.warn('No proxy headers found, using request URL host', {
      host,
      context: 'OAuth'
    })
  }

  return {protocol, host}
}

/**
 * GET handler for Reddit OAuth callback.
 * Validates OAuth state, delegates to {@link processOAuthCallback} for
 * token exchange and identity resolution, then persists the session.
 *
 * Security measures:
 * - CSRF protection via timing-safe state parameter comparison
 * - Redirect URI monitoring (logged for security review)
 * - Secure HTTP-only session cookies via iron-session
 *
 * @param request - Next.js request object
 * @returns Redirect to homepage on success, error response on failure
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const error = url.searchParams.get('error')
  const storedState = request.cookies.get('reddit_oauth_state')?.value

  logger.debug('OAuth Callback', {
    code: !!code,
    state: !!state,
    storedState: !!storedState,
    error,
    context: 'OAuth'
  })

  // Handle OAuth error from Reddit
  if (error) {
    logger.error('OAuth error from Reddit', {
      error,
      description: url.searchParams.get('error_description'),
      context: 'OAuth'
    })
    const {protocol, host} = resolveHostFromRequest(request)

    const response = NextResponse.redirect(
      new URL(`/?error=${encodeURIComponent(error)}`, `${protocol}://${host}`)
    )
    response.cookies.delete('reddit_oauth_state')
    return response
  }

  // Validate state to prevent CSRF attacks (timing-safe comparison)
  const statesMatch =
    !!state &&
    !!storedState &&
    state.length === storedState.length &&
    timingSafeEqual(Buffer.from(state), Buffer.from(storedState))

  if (!code || !state || !storedState || !statesMatch) {
    logger.error('State validation failed - possible CSRF attack', {
      hasCode: !!code,
      hasState: !!state,
      hasStoredState: !!storedState,
      statesMatch,
      url: url.toString(),
      referer: request.headers.get('referer') || 'none',
      userAgent: request.headers.get('user-agent')?.substring(0, 100) || 'none',
      context: 'OAuth'
    })
    const response = new NextResponse('Invalid state parameter', {status: 400})
    response.cookies.delete('reddit_oauth_state')
    return response
  }

  // Log redirect URI for monitoring (validation handled by Reddit OAuth + state parameter)
  const configuredRedirectUri = getEnvVar('REDDIT_REDIRECT_URI')
  const callbackUrl = new URL(request.url)
  callbackUrl.search = ''

  if (callbackUrl.toString() !== configuredRedirectUri) {
    logger.warn('Redirect URI mismatch (expected in proxied environments)', {
      callback: callbackUrl.toString(),
      configured: configuredRedirectUri,
      context: 'OAuth'
    })
  }

  try {
    const result = await processOAuthCallback(code)

    if (!result.ok) {
      logger.error('OAuth callback processing failed', {
        reason: result.reason,
        message: result.message,
        context: 'OAuthCallback'
      })

      // Map failure reasons to HTTP status codes
      if (result.message.includes('401')) {
        return new NextResponse('Authentication expired', {status: 401})
      }
      if (result.message.includes('429') || result.message.includes('rate')) {
        return new NextResponse('Rate limit exceeded', {status: 429})
      }
      if (
        result.message.includes('503') ||
        result.message.includes('unavailable')
      ) {
        return new NextResponse('Reddit API unavailable', {status: 503})
      }

      return new NextResponse(`Authentication failed: ${result.message}`, {
        status: 500
      })
    }

    await persistSession(result.sessionData)

    logger.info('OAuth authentication successful', {
      username: result.sessionData.username,
      userId: result.sessionData.userId,
      hasRefreshToken: !!result.sessionData.refreshToken,
      expiresIn: `${Math.round((result.sessionData.expiresAt - Date.now()) / 1000 / 60)}min`,
      context: 'OAuthCallback'
    })

    // Build redirect URL using proper host (handles reverse proxies)
    const {protocol, host} = resolveHostFromRequest(request)
    const redirectUrl = new URL('/', `${protocol}://${host}`)

    const response = NextResponse.redirect(redirectUrl)
    response.cookies.delete('reddit_oauth_state')

    return response
  } catch (error) {
    logger.error('OAuth authentication failed', {
      error: error instanceof Error ? error.message : String(error),
      context: 'OAuthCallback'
    })

    return new NextResponse(
      `Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      {status: 500}
    )
  }
}
