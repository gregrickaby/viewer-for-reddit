import {getClientInfo, logAuditEvent} from '@/lib/auth/auditLog'
import {checkRateLimit} from '@/lib/auth/rateLimit'
import {deleteSession} from '@/lib/auth/session'
import {logError} from '@/lib/utils/logError'
import {NextRequest, NextResponse} from 'next/server'

/**
 * OAuth 2.0 logout handler.
 *
 * Terminates the user's session by:
 * 1. Destroying the encrypted session cookie
 * 2. Logging the logout event for security monitoring
 * 3. Returning success response with cache prevention
 *
 * @security
 * - Rate limiting applied to prevent logout spam
 * - Audit logging for security monitoring
 * - Graceful error handling to prevent info disclosure
 * - Cache prevention headers on response
 * - CSRF protection via fetch same-origin policy
 *
 * @flow
 * 1. User clicks "Sign out" button
 * 2. Client calls POST /api/auth/logout
 * 3. This route destroys session cookie
 * 4. Client clears Redux state and redirects to home
 *
 * @remarks
 * Note: This only destroys the local session cookie. Reddit OAuth tokens
 * remain valid until expiration. For maximum security, tokens should be
 * revoked on Reddit's end (future enhancement).
 *
 * @param request - Next.js request object (for rate limiting and audit logging)
 * @returns Success response or error
 */
export async function POST(request: NextRequest) {
  // Apply rate limiting to prevent abuse
  const rateLimitResponse = await checkRateLimit(request)
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  try {
    // Destroy the encrypted session cookie
    await deleteSession()

    // Audit log for security monitoring
    logAuditEvent({
      type: 'logout',
      ...getClientInfo(request)
    })

    const response = NextResponse.json({success: true})

    // Prevent caching by CDN/proxies
    response.headers.set(
      'Cache-Control',
      'private, no-cache, no-store, must-revalidate'
    )
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')

    return response
  } catch (error) {
    // Log error for debugging but don't expose details to client
    logError(error, {
      component: 'LogoutRoute',
      action: 'deleteSession',
      ...getClientInfo(request)
    })

    // Return generic error to prevent info disclosure
    return NextResponse.json(
      {error: 'Failed to logout. Please try again.'},
      {status: 500}
    )
  }
}
