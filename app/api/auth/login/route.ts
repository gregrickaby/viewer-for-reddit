import {reddit} from '@/lib/auth/arctic'
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
  const scopes = ['identity', 'read', 'mysubreddits', 'vote']

  // Create authorization URL
  // Note: Arctic doesn't expose duration param directly, but Reddit defaults
  // to permanent duration when offline_access/refresh tokens are requested
  const url = reddit.createAuthorizationURL(state, scopes)

  // Capture origin URL for post-authentication redirect
  // This enables preview deployments to redirect through production callback
  const origin =
    request.headers.get('origin') ||
    request.headers.get('referer')?.replace(/\/$/, '') ||
    process.env.AUTH_URL ||
    'https://reddit-viewer.com'

  // Store state in cookie for CSRF protection
  const cookieStore = await cookies()
  cookieStore.set('reddit_oauth_state', state, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 10, // 10 minutes
    path: '/'
  })

  // Store origin for post-auth redirect (multi-environment support)
  cookieStore.set('reddit_oauth_origin', origin, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 10, // 10 minutes
    path: '/'
  })

  return NextResponse.redirect(url)
}
