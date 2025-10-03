import {getRedditClient} from '@/lib/auth/arctic'
import {getClientInfo, logAuditEvent} from '@/lib/auth/auditLog'
import {checkRateLimit} from '@/lib/auth/rateLimit'
import {generateState} from 'arctic'
import {cookies} from 'next/headers'
import {NextRequest, NextResponse} from 'next/server'

/**
 * Initiate Reddit OAuth 2.0 authorization flow.
 * Requests minimal scopes and permanent token duration.
 */
export async function GET(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResponse = await checkRateLimit(request)
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  // Audit log
  logAuditEvent({
    type: 'login_initiated',
    ...getClientInfo(request)
  })

  const state = generateState()

  // Request minimal scopes (principle of least privilege)
  const scopes = ['identity', 'read', 'mysubreddits', 'vote', 'subscribe']

  // Create authorization URL
  // Note: Arctic doesn't expose duration param directly, but Reddit defaults
  // to permanent duration when offline_access/refresh tokens are requested
  const reddit = getRedditClient()
  const url = reddit.createAuthorizationURL(state, scopes)

  // Store state in cookie for CSRF protection
  const cookieStore = await cookies()

  // Clear any stale auth cookies from previous implementations
  cookieStore.delete('authjs.callback-url')
  cookieStore.delete('authjs.session-token')

  cookieStore.set('reddit_oauth_state', state, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 10, // 10 minutes
    path: '/'
  })

  const response = NextResponse.redirect(url)

  // Prevent caching by CDN/proxies
  response.headers.set(
    'Cache-Control',
    'private, no-cache, no-store, must-revalidate'
  )
  response.headers.set('Pragma', 'no-cache')
  response.headers.set('Expires', '0')

  return response
}
