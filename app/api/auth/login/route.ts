import {logger} from '@/lib/datadog/server'
import {TEN_MINUTES} from '@/lib/utils/constants'
import {isProduction} from '@/lib/utils/env'
import {getErrorMessage} from '@/lib/utils/errors'
import {createLoginUrl} from '@/lib/utils/reddit-auth'
import {NextResponse} from 'next/server'

/**
 * GET handler for Reddit OAuth login.
 * Initiates OAuth flow by redirecting to Reddit's authorization page.
 *
 * Features:
 * - Generates random state for CSRF protection
 * - Requests permanent refresh tokens (duration=permanent)
 * - Sets secure HTTP-only cookie for state validation
 * - Requests comprehensive OAuth scopes
 *
 * @returns Redirect to Reddit authorization URL
 *
 * @example
 * ```typescript
 * // User clicks login button
 * // Browser redirects to /api/auth/login
 * // Server redirects to Reddit OAuth page
 * ```
 */
export async function GET(): Promise<NextResponse> {
  try {
    const {url, state} = await createLoginUrl()

    logger.debug('OAuth login initiated', {
      state: `${state.substring(0, 8)}...`,
      context: 'OAuth'
    })

    const response = NextResponse.redirect(url.toString())
    response.cookies.set('reddit_oauth_state', state, {
      httpOnly: true,
      secure: isProduction(),
      sameSite: 'lax',
      maxAge: TEN_MINUTES
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
