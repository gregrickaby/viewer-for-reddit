import {getEnvVar, isProduction} from '@/lib/utils/env'
import {logger} from '@/lib/utils/logger'
import {Reddit} from 'arctic'
import {NextResponse} from 'next/server'

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
    logger.debug('OAuth login initiated', undefined, {context: 'OAuth'})

    const state = crypto.randomUUID()
    const scopes = [
      'identity',
      'read',
      'vote',
      'subscribe',
      'mysubreddits',
      'save',
      'submit',
      'edit',
      'history'
    ]

    // Create authorization URL with duration=permanent for refresh tokens
    const url = reddit.createAuthorizationURL(state, scopes)

    // Add duration parameter manually (Arctic doesn't support this directly)
    const authUrl = new URL(url)
    authUrl.searchParams.set('duration', 'permanent')

    const response = NextResponse.redirect(authUrl.toString())
    response.cookies.set('reddit_oauth_state', state, {
      httpOnly: true,
      secure: isProduction(),
      sameSite: 'lax',
      maxAge: 600 // 10 minutes
    })

    logger.debug(
      'Redirecting to Reddit authorization',
      {scopes: scopes.length, hasState: !!state},
      {context: 'OAuth'}
    )

    return response
  } catch (error) {
    logger.error('Failed to initiate OAuth login', error, {
      context: 'OAuthLogin'
    })
    return new NextResponse('Failed to initiate login', {status: 500})
  }
}
