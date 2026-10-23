import { randomBytes } from 'node:crypto'
import { NextResponse, type NextRequest } from 'next/server'

import {
  cookieOptions,
  OAUTH_COOKIE,
  OAUTH_STATE_MAX_AGE,
  sealOAuthState,
} from '@/lib/auth/cookies'
import { safeNext } from '@/lib/auth/next-param'
import { buildAuthorizeUrl } from '@/lib/auth/oauth'

/** Starts the Reddit OAuth flow. */
export async function GET(request: NextRequest) {
  const state = randomBytes(32).toString('base64url')
  const next = safeNext(request.nextUrl.searchParams.get('next'))

  const response = NextResponse.redirect(buildAuthorizeUrl(state))
  response.cookies.set(
    OAUTH_COOKIE,
    await sealOAuthState({ state, next }),
    cookieOptions(OAUTH_STATE_MAX_AGE, '/api/auth'),
  )
  return response
}
