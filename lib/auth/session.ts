/**
 * Session management using iron-session.
 * Provides encrypted, cookie-based sessions for OAuth authentication.
 * Session configuration adapts based on environment (development/production).
 */

import {SessionData} from '@/lib/types/reddit'
import {getEnvVar, isProduction} from '@/lib/utils/env'
import {getIronSession, IronSession, SessionOptions} from 'iron-session'
import {cookies} from 'next/headers'

/**
 * Get iron-session configuration options.
 * Session cookies are:
 * - Encrypted with SESSION_SECRET (min 32 chars)
 * - HTTP-only (not accessible via JavaScript)
 * - Secure in production only (requires HTTPS)
 * - Valid for 1 day (aligned with token refresh cycle)
 * - Domain-restricted in production
 *
 * Created as a function to avoid module-level evaluation issues with Next.js 16.
 */
function getSessionOptions(): SessionOptions {
  const options: SessionOptions = {
    password: getEnvVar('SESSION_SECRET'),
    cookieName: 'reddit_viewer_session',
    cookieOptions: {
      secure: isProduction(),
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 1 day (better balance with token lifecycle)
      path: '/'
    }
  }

  // Add domain restriction in production for enhanced security
  if (isProduction() && options.cookieOptions) {
    try {
      const baseUrl = new URL(getEnvVar('BASE_URL'))
      options.cookieOptions.domain = baseUrl.hostname
    } catch (error) {
      // If BASE_URL is invalid, continue without domain restriction
      // Logging would happen at startup validation
    }
  }

  return options
}

/**
 * Get the current user's iron-session.
 * Session data includes OAuth tokens, username, and expiration time.
 *
 * @returns Promise resolving to IronSession with SessionData
 *
 * @example
 * ```typescript
 * const session = await getSession()
 * if (session.accessToken) {
 *   console.log(`Authenticated as ${session.username}`)
 * }
 * ```
 */
export async function getSession(): Promise<IronSession<SessionData>> {
  const cookieStore = await cookies()
  return getIronSession<SessionData>(cookieStore, getSessionOptions())
}

/**
 * Check if the current user has a valid authenticated session.
 * Validates both token presence and expiration time.
 *
 * @returns Promise resolving to true if authenticated and not expired
 *
 * @example
 * ```typescript
 * const authenticated = await isAuthenticated()
 * if (!authenticated) {
 *   redirect('/login')
 * }
 * ```
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession()
  const hasToken = !!session.accessToken
  const notExpired = session.expiresAt ? session.expiresAt > Date.now() : false
  return hasToken && notExpired
}

/**
 * Check if the session exists but is expired.
 * Used to detect when a user needs to re-authenticate.
 *
 * @returns Promise resolving to true if session exists but is expired
 *
 * @example
 * ```typescript
 * const expired = await isSessionExpired()
 * if (expired) {
 *   // Show re-authentication prompt
 * }
 * ```
 */
export async function isSessionExpired(): Promise<boolean> {
  const session = await getSession()
  const hasToken = !!session.accessToken
  const isExpired = session.expiresAt ? session.expiresAt <= Date.now() : true
  return hasToken && isExpired
}
