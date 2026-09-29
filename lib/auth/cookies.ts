import 'server-only'
import { sealData, unsealData } from 'iron-session'
import * as z from 'zod'
import { env } from '@/lib/env'

/*
 * Session cookies (docs/design.md §5.4). Access and refresh tokens live in separate
 * sealed cookies: Reddit's tokens are long, and one cookie holding both risks the
 * ~4 KB per-cookie limit. This module is shared by proxy.ts and the DAL, so it must
 * not import `next/headers`.
 */

export const ACCESS_COOKIE = 'rv_at'
export const REFRESH_COOKIE = 'rv_rt'
export const OAUTH_COOKIE = 'rv_oauth'

export const REFRESH_MAX_AGE = 60 * 60 * 24 * 30
export const OAUTH_STATE_MAX_AGE = 60 * 10
/** Refresh proactively when the access token has less than this left. */
export const REFRESH_SKEW_MS = 5 * 60 * 1000

const AccessToken = z.object({
  accessToken: z.string().min(1),
  expiresAt: z.number().int().positive(),
})
const RefreshToken = z.object({
  v: z.literal(1),
  refreshToken: z.string().min(1),
  username: z.string().min(1),
  scope: z.string(),
})
const OAuthState = z.object({
  state: z.string().min(32),
  next: z.string(),
})

export type AccessToken = z.infer<typeof AccessToken>
export type RefreshToken = z.infer<typeof RefreshToken>
export type OAuthState = z.infer<typeof OAuthState>

function seal(data: object, ttlSeconds: number): Promise<string> {
  return sealData(data, { password: env.SESSION_SECRET, ttl: ttlSeconds })
}

async function unseal<T extends z.ZodType>(
  schema: T,
  value: string | undefined,
): Promise<z.infer<T> | null> {
  if (!value) return null
  try {
    // An expired or tampered seal unseals to `{}`, which fails the schema.
    const parsed = schema.safeParse(await unsealData(value, { password: env.SESSION_SECRET }))
    return parsed.success ? parsed.data : null
  } catch {
    return null
  }
}

/** Seconds until `expiresAt`, never less than one minute. */
export function secondsUntil(expiresAt: number, now = Date.now()): number {
  return Math.max(60, Math.floor((expiresAt - now) / 1000))
}

export const sealAccess = (token: AccessToken) => seal(token, secondsUntil(token.expiresAt))
export const unsealAccess = (value?: string) => unseal(AccessToken, value)

export const sealRefresh = (token: RefreshToken) => seal(token, REFRESH_MAX_AGE)
export const unsealRefresh = (value?: string) => unseal(RefreshToken, value)

export const sealOAuthState = (state: OAuthState) => seal(state, OAUTH_STATE_MAX_AGE)
export const unsealOAuthState = (value?: string) => unseal(OAuthState, value)

export function cookieOptions(maxAgeSeconds: number, path = '/') {
  return {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path,
    maxAge: maxAgeSeconds,
  } as const
}

export function needsRefresh(token: AccessToken | null, now = Date.now()): boolean {
  return !token || token.expiresAt - now < REFRESH_SKEW_MS
}
