import { NextResponse, type NextRequest } from 'next/server'
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  REFRESH_MAX_AGE,
  cookieOptions,
  needsRefresh,
  sealAccess,
  sealRefresh,
  secondsUntil,
  unsealAccess,
  unsealRefresh,
} from '@/lib/auth/cookies'
import { refreshAccessToken } from '@/lib/auth/oauth'
import { env } from '@/lib/env'
import { securityHeaders } from '@/lib/security/headers'
import { PUBLIC_PAGES } from '@/lib/site'

const PUBLIC_PATHS = new Set<string>([...PUBLIC_PAGES, '/manifest.webmanifest'])

const isPublicPath = (pathname: string) =>
  PUBLIC_PATHS.has(pathname) || pathname.startsWith('/api/auth/')

type OutgoingCookie = { name: string; value: string; maxAge: number }

/**
 * Runs before every page, Server Action, and Route Handler (docs/design.md §5.5):
 * 1. Proactively refreshes the Reddit access token and hands the fresh token to
 *    the rest of *this* request (request cookies) and to the browser (response).
 * 2. Optimistic auth gating. The DAL's `requireAuth()` is the real boundary.
 */
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  const refresh = await unsealRefresh(request.cookies.get(REFRESH_COOKIE)?.value)
  const access = await unsealAccess(request.cookies.get(ACCESS_COOKIE)?.value)
  const outgoing: OutgoingCookie[] = []

  if (refresh && needsRefresh(access)) {
    const result = await refreshAccessToken(refresh.refreshToken)

    if (result.kind === 'invalid_grant') {
      const url = new URL('/', request.url)
      url.searchParams.set('error', 'session_expired')
      const response = NextResponse.redirect(url)
      response.cookies.delete(ACCESS_COOKIE)
      response.cookies.delete(REFRESH_COOKIE)
      return withSecurityHeaders(response)
    }

    if (result.kind === 'ok') {
      const sealedAccess = await sealAccess({
        accessToken: result.accessToken,
        expiresAt: result.expiresAt,
      })
      const sealedRefresh = await sealRefresh({
        ...refresh,
        refreshToken: result.refreshToken ?? refresh.refreshToken,
      })
      // `RequestCookies.set` rewrites the request's Cookie header, which
      // NextResponse.next({ request: { headers } }) forwards downstream.
      request.cookies.set(ACCESS_COOKIE, sealedAccess)
      request.cookies.set(REFRESH_COOKIE, sealedRefresh)
      outgoing.push(
        { name: ACCESS_COOKIE, value: sealedAccess, maxAge: secondsUntil(result.expiresAt) },
        { name: REFRESH_COOKIE, value: sealedRefresh, maxAge: REFRESH_MAX_AGE },
      )
    }
    // A transient failure falls through: the DAL and error boundaries handle an
    // expired token if the current one is no longer usable.
  }

  const signedIn = refresh !== null
  let response: NextResponse

  if (!signedIn && !isPublicPath(pathname) && request.method === 'GET') {
    const url = new URL('/', request.url)
    url.searchParams.set('next', `${pathname}${search}`)
    response = NextResponse.redirect(url)
  } else if (signedIn && pathname === '/') {
    response = NextResponse.redirect(new URL('/home', request.url))
  } else {
    response = NextResponse.next({ request: { headers: request.headers } })
  }

  for (const cookie of outgoing) {
    response.cookies.set(cookie.name, cookie.value, cookieOptions(cookie.maxAge))
  }
  return withSecurityHeaders(response)
}

function withSecurityHeaders(response: NextResponse): NextResponse {
  const headers = securityHeaders({
    dev: process.env.NODE_ENV === 'development',
    https: env.BASE_URL.startsWith('https:'),
  })
  for (const [name, value] of Object.entries(headers)) response.headers.set(name, value)
  return response
}

export const config = {
  matcher: [
    // Everything except build assets and static files.
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml)$).*)',
  ],
}
