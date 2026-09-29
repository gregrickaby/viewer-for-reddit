import 'server-only'
import * as z from 'zod'
import { env } from '@/lib/env'

/**
 * Every scope is requested at first sign-in so later features never force a
 * re-consent (docs/design.md §5.2).
 */
export const SCOPES = [
  'identity',
  'read',
  'history',
  'mysubreddits',
  'subscribe',
  'vote',
  'submit',
  'edit',
  'save',
] as const

const TokenOk = z.object({
  access_token: z.string().min(1),
  token_type: z.literal('bearer'),
  expires_in: z.number().positive(),
  scope: z.string(),
  refresh_token: z.string().min(1).optional(),
})
const TokenError = z.object({ error: z.string() })
const Identity = z.object({ name: z.string().min(1) })

export type TokenSet = {
  accessToken: string
  expiresAt: number
  refreshToken?: string
  scope: string
}

export type TokenResult =
  | ({ kind: 'ok' } & TokenSet)
  | { kind: 'invalid_grant' }
  | { kind: 'error'; status: number; error: string }

export function buildAuthorizeUrl(state: string): URL {
  const url = new URL('/api/v1/authorize', env.REDDIT_WWW_BASE)
  url.search = new URLSearchParams({
    client_id: env.REDDIT_CLIENT_ID,
    response_type: 'code',
    state,
    redirect_uri: env.REDDIT_REDIRECT_URI,
    duration: 'permanent',
    scope: SCOPES.join(' '),
  }).toString()
  return url
}

function basicAuth(): string {
  return `Basic ${Buffer.from(`${env.REDDIT_CLIENT_ID}:${env.REDDIT_CLIENT_SECRET}`).toString('base64')}`
}

async function postToken(body: Record<string, string>): Promise<TokenResult> {
  let response: Response
  try {
    response = await fetch(new URL('/api/v1/access_token', env.REDDIT_WWW_BASE), {
      method: 'POST',
      headers: {
        Authorization: basicAuth(),
        'User-Agent': env.USER_AGENT,
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: new URLSearchParams(body),
      cache: 'no-store',
    })
  } catch (cause) {
    return { kind: 'error', status: 0, error: cause instanceof Error ? cause.message : 'network' }
  }

  const json: unknown = await response.json().catch(() => null)

  // Reddit reports grant errors in the body, with HTTP 200 *or* 400.
  const failure = TokenError.safeParse(json)
  if (failure.success) {
    return failure.data.error === 'invalid_grant'
      ? { kind: 'invalid_grant' }
      : { kind: 'error', status: response.status, error: failure.data.error }
  }

  const ok = TokenOk.safeParse(json)
  if (!response.ok || !ok.success) {
    return { kind: 'error', status: response.status, error: 'unexpected_response' }
  }

  return {
    kind: 'ok',
    accessToken: ok.data.access_token,
    expiresAt: Date.now() + ok.data.expires_in * 1000,
    refreshToken: ok.data.refresh_token,
    scope: ok.data.scope,
  }
}

export function exchangeCode(code: string): Promise<TokenResult> {
  return postToken({
    grant_type: 'authorization_code',
    code,
    redirect_uri: env.REDDIT_REDIRECT_URI,
  })
}

export function refreshAccessToken(refreshToken: string): Promise<TokenResult> {
  return postToken({ grant_type: 'refresh_token', refresh_token: refreshToken })
}

/** Best-effort: revoking a refresh token also invalidates its access tokens. */
export async function revokeToken(refreshToken: string): Promise<boolean> {
  try {
    const response = await fetch(new URL('/api/v1/revoke_token', env.REDDIT_WWW_BASE), {
      method: 'POST',
      headers: {
        Authorization: basicAuth(),
        'User-Agent': env.USER_AGENT,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ token: refreshToken, token_type_hint: 'refresh_token' }),
      cache: 'no-store',
    })
    return response.ok
  } catch {
    return false
  }
}

/**
 * Username lookup for the OAuth callback, before any session cookie exists.
 * Everything else goes through the Data Access Layer.
 */
export async function fetchIdentity(accessToken: string): Promise<{ name: string } | null> {
  try {
    const response = await fetch(new URL('/api/v1/me?raw_json=1', env.REDDIT_API_BASE), {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'User-Agent': env.USER_AGENT,
        Accept: 'application/json',
      },
      cache: 'no-store',
    })
    if (!response.ok) return null
    const parsed = Identity.safeParse(await response.json())
    return parsed.success ? parsed.data : null
  } catch {
    return null
  }
}
