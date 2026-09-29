import { NextResponse, type NextRequest } from 'next/server'
import { ACCESS_COOKIE, REFRESH_COOKIE } from '@/lib/auth/cookies'
import { safeNext } from '@/lib/auth/next-param'

/**
 * Clears a dead session. Server Components can't delete cookies, so the DAL
 * redirects here when Reddit rejects a token (docs/design.md §5.5). It does not
 * revoke: the token is already unusable. User-initiated sign-out is the
 * `signOut` Server Action.
 */
export function GET(request: NextRequest) {
  const url = new URL('/', request.url)
  if (request.nextUrl.searchParams.get('reason') === 'expired') {
    url.searchParams.set('error', 'session_expired')
  }
  const next = request.nextUrl.searchParams.get('next')
  if (next) url.searchParams.set('next', safeNext(next))

  const response = NextResponse.redirect(url)
  response.cookies.delete(ACCESS_COOKIE)
  response.cookies.delete(REFRESH_COOKIE)
  return response
}
