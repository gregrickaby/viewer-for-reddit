import {getRedditClient} from '@/lib/auth/arctic'
import {getClientInfo, logAuditEvent} from '@/lib/auth/auditLog'
import {checkRateLimit} from '@/lib/auth/rateLimit'
import {createUncachedRedirect} from '@/lib/utils/routing/redirectHelpers'
import {generateState} from 'arctic'
import {cookies} from 'next/headers'
import {NextRequest} from 'next/server'

/**
 * OAuth 2.0 login initiation handler.
 *
 * Initiates the Reddit OAuth authorization flow by:
 * 1. Generating cryptographic state parameter for CSRF protection
 * 2. Creating Reddit authorization URL with minimal required scopes
 * 3. Storing state in httpOnly cookie
 * 4. Redirecting user to Reddit's authorization page
 *
 * @security
 * - Rate limiting applied before processing
 * - CSRF protection via cryptographic state parameter
 * - State stored in httpOnly, sameSite cookie
 * - Secure cookie flag in production
 * - Cache prevention headers on redirect
 *
 * @flow
 * 1. User clicks "Sign in" button
 * 2. This route generates state and redirects to Reddit
 * 3. User approves on Reddit
 * 4. Reddit redirects back to /api/auth/callback/reddit
 *
 * @param request - Next.js request object
 * @returns Redirect response to Reddit authorization page
 */
export async function GET(request: NextRequest) {
  // Apply rate limiting to prevent abuse
  const rateLimitResponse = await checkRateLimit(request)
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  // Audit log for security monitoring
  logAuditEvent({
    type: 'login_initiated',
    ...getClientInfo(request)
  })

  // Generate cryptographic random state for CSRF protection
  const state = generateState()

  // Request minimal scopes following principle of least privilege
  // - identity: User identification (required)
  // - read: Read posts and comments
  // - mysubreddits: Access user's subscribed subreddits
  // - vote: Upvote/downvote content
  // - subscribe: Subscribe to subreddits
  // - history: Access user's saved posts and comments
  // - submit: Submit links and comments
  const scopes = [
    'identity',
    'read',
    'mysubreddits',
    'vote',
    'subscribe',
    'history',
    'submit'
  ]

  // Create Reddit OAuth authorization URL with permanent duration
  // Reddit only provides refresh tokens for permanent duration requests
  const reddit = getRedditClient()
  const url = reddit.createAuthorizationURL(state, scopes)
  url.searchParams.set('duration', 'permanent')

  // Store state in httpOnly cookie for CSRF validation in callback
  const cookieStore = await cookies()

  cookieStore.set('reddit_oauth_state', state, {
    httpOnly: true, // Prevents JavaScript access
    sameSite: 'lax', // CSRF protection
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    maxAge: 60 * 10, // 10 minutes - sufficient for OAuth flow
    path: '/'
  })

  // Redirect to Reddit with cache prevention headers
  return createUncachedRedirect(url)
}
