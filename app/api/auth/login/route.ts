import {createLoginUrl} from '@/lib/reddit-auth'
import {logger} from '@/lib/axiom/server'
import {isProduction} from '@/lib/utils/env'
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

    logger.info('OAuth login initiated', {
      state: `${state.substring(0, 8)}...`,
      context: 'OAuth'
    })

    const response = NextResponse.redirect(url.toString())
    response.cookies.set('reddit_oauth_state', state, {
      httpOnly: true,
      secure: isProduction(),
      sameSite: 'lax',
      maxAge: 600 // 10 minutes
    })

    return response
  } catch (error) {
    logger.error('Failed to initiate OAuth login', {
      error: error instanceof Error ? error.message : String(error),
      context: 'OAuthLogin'
    })
    return new NextResponse('Failed to initiate login', {status: 500})
  }
}
