import { timingSafeEqual } from 'node:crypto'
import { NextResponse, type NextRequest } from 'next/server'
import {
  ACCESS_COOKIE,
  OAUTH_COOKIE,
  REFRESH_COOKIE,
  REFRESH_MAX_AGE,
  cookieOptions,
  sealAccess,
  sealRefresh,
  secondsUntil,
  unsealOAuthState,
} from '@/lib/auth/cookies'
import { exchangeCode, fetchIdentity } from '@/lib/auth/oauth'

type LandingError = 'denied' | 'state' | 'exchange'

function toLanding(request: NextRequest, error: LandingError) {
  const url = new URL('/', request.url)
  url.searchParams.set('error', error)
  const response = NextResponse.redirect(url)
  response.cookies.delete({ name: OAUTH_COOKIE, path: '/api/auth' })
  return response
}

function sameState(a: string, b: string): boolean {
  const left = Buffer.from(a)
  const right = Buffer.from(b)
  return left.length === right.length && timingSafeEqual(left, right)
}

/** Completes the Reddit OAuth flow and establishes the session (docs/design.md §5.3). */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams
  if (params.get('error')) return toLanding(request, 'denied')

  const code = params.get('code')
  const state = params.get('state')
  const saved = await unsealOAuthState(request.cookies.get(OAUTH_COOKIE)?.value)
  if (!code || !state || !saved || !sameState(state, saved.state)) {
    return toLanding(request, 'state')
  }

  const tokens = await exchangeCode(code)
  if (tokens.kind !== 'ok' || !tokens.refreshToken) return toLanding(request, 'exchange')

  const identity = await fetchIdentity(tokens.accessToken)
  if (!identity) return toLanding(request, 'exchange')

  const response = NextResponse.redirect(new URL(saved.next, request.url))
  response.cookies.set(
    ACCESS_COOKIE,
    await sealAccess({ accessToken: tokens.accessToken, expiresAt: tokens.expiresAt }),
    cookieOptions(secondsUntil(tokens.expiresAt)),
  )
  response.cookies.set(
    REFRESH_COOKIE,
    await sealRefresh({
      v: 1,
      refreshToken: tokens.refreshToken,
      username: identity.name,
      scope: tokens.scope,
    }),
    cookieOptions(REFRESH_MAX_AGE),
  )
  response.cookies.delete({ name: OAUTH_COOKIE, path: '/api/auth' })
  return response
}
