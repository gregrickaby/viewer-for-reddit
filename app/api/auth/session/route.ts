import {getClientInfo} from '@/lib/auth/auditLog'
import {checkRateLimit} from '@/lib/auth/rateLimit'
import {getClientSession} from '@/lib/auth/session'
import {logError} from '@/lib/utils/logError'
import {NextRequest, NextResponse} from 'next/server'

/**
 * Session status check handler.
 *
 * Returns client-safe session information without sensitive tokens:
 * 1. Checking rate limits to prevent enumeration
 * 2. Retrieving session data (client-safe, no tokens)
 * 3. Returning session status with cache prevention headers
 *
 * @security
 * - Rate limiting to prevent session enumeration and DoS
 * - Returns only client-safe fields (no access/refresh tokens)
 * - Cache prevention headers prevent CDN/proxy caching
 * - Graceful error handling prevents info disclosure
 *
 * @flow
 * 1. Client polls for session status (e.g., on app load, after auth)
 * 2. This route checks if user has valid session
 * 3. Returns username, expiration, and auth status (no tokens)
 * 4. Client updates UI based on authentication state
 *
 * @remarks
 * This endpoint is frequently polled by clients to check auth status.
 * Rate limiting is critical to prevent abuse. The response intentionally
 * excludes tokens - those are stored server-side in encrypted cookies.
 * Use this for UI state, not for authenticating API calls.
 *
 * @param request - Next.js request object (for rate limiting)
 * @returns Client-safe session data or null if not authenticated
 */
export async function GET(request: NextRequest) {
  // Apply rate limiting to prevent session enumeration and DoS
  const rateLimitResponse = await checkRateLimit(request)
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  try {
    // Get client-safe session (excludes tokens)
    const session = await getClientSession()

    const response = NextResponse.json(session)

    // Prevent caching by CDN/proxies - session state changes frequently
    response.headers.set(
      'Cache-Control',
      'private, no-cache, no-store, must-revalidate'
    )
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')

    return response
  } catch (error) {
    // Log error with context for debugging
    logError(error, {
      component: 'SessionRoute',
      action: 'getSession',
      ...getClientInfo(request)
    })

    // Return null on error (same as no session) to prevent info disclosure
    const response = NextResponse.json(null, {status: 500})

    // Cache prevention headers on error responses too
    response.headers.set(
      'Cache-Control',
      'private, no-cache, no-store, must-revalidate'
    )
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')

    return response
  }
}
