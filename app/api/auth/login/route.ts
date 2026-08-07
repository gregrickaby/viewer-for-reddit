import {logger} from '@/lib/datadog/server'
import {FIFTEEN_MINUTES, ONE_MINUTE} from '@/lib/utils/constants'
import {getCookieDomain, isProduction} from '@/lib/utils/env'
import {getErrorMessage} from '@/lib/utils/errors'
import {checkRateLimit, getClientIp} from '@/lib/utils/rate-limit'
import {createLoginUrl} from '@/lib/utils/reddit-auth'
import {NextRequest, NextResponse} from 'next/server'

// Login itself only builds an authorize URL and sets a state cookie (no
// Reddit call), but it's still the app's only unauthenticated entry point,
// so cap repeat hits per IP to keep it from being hammered.
const LOGIN_RATE_LIMIT = 10
const LOGIN_RATE_WINDOW_MS = ONE_MINUTE * 1000

/**
 * GET handler for Reddit OAuth login.
 * Initiates OAuth flow by redirecting to Reddit's authorization page.
 *
 * Features:
 * - Rate limited per IP (10 requests/minute)
 * - Generates random state for CSRF protection
 * - Requests permanent refresh tokens (duration=permanent)
 * - Sets secure HTTP-only cookie for state validation
 * - Requests comprehensive OAuth scopes
 *
 * @param request - Next.js request object
 * @returns Redirect to Reddit authorization URL
 *
 * @example
 * ```typescript
 * // User clicks login button
 * // Browser redirects to /api/auth/login
 * // Server redirects to Reddit OAuth page
 * ```
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const ip = getClientIp(request.headers)
  const {allowed, retryAfterSeconds} = checkRateLimit(`login:${ip}`, {
    limit: LOGIN_RATE_LIMIT,
    windowMs: LOGIN_RATE_WINDOW_MS
  })

  if (!allowed) {
    // This is our own app-level throttle on /api/auth/login, not a rate
    // limit imposed by Reddit - Reddit is never contacted for this request.
    logger.warn('App rate limit exceeded for /api/auth/login', {
      ip,
      context: 'OAuthLogin'
    })
    return new NextResponse(
      'Too many login attempts. Please try again shortly.',
      {
        status: 429,
        headers: {'Retry-After': retryAfterSeconds.toString()}
      }
    )
  }

  try {
    const {url, state} = await createLoginUrl()

    const response = NextResponse.redirect(url.toString())
    const domain = getCookieDomain()

    response.cookies.set('reddit_oauth_state', state, {
      httpOnly: true,
      secure: isProduction(),
      sameSite: 'lax',
      maxAge: FIFTEEN_MINUTES,
      path: '/',
      ...(domain ? {domain} : {})
    })

    return response
  } catch (error) {
    logger.error('Failed to initiate OAuth login', {
      error: getErrorMessage(error),
      context: 'OAuthLogin'
    })
    return new NextResponse('Failed to initiate login', {status: 500})
  }
}
