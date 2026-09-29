import 'server-only'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { cache } from 'react'
import { ACCESS_COOKIE, REFRESH_COOKIE, unsealAccess, unsealRefresh } from './cookies'

export type Auth = {
  accessToken: string
  username: string
}

/**
 * Thrown when the user is signed in but no usable access token reached this
 * request, which happens when the proxy's refresh failed transiently. It is
 * retryable, so error boundaries offer "Try again" rather than signing out.
 */
export class SessionUnavailableError extends Error {
  constructor() {
    super('Your Reddit session could not be refreshed. Please try again.')
    this.name = 'SessionUnavailableError'
  }
}

const readSession = cache(async () => {
  const jar = await cookies()
  const [access, refresh] = await Promise.all([
    unsealAccess(jar.get(ACCESS_COOKIE)?.value),
    unsealRefresh(jar.get(REFRESH_COOKIE)?.value),
  ])
  const usable = access !== null && access.expiresAt > Date.now()
  return { access: usable ? access : null, refresh }
})

/**
 * The Data Access Layer's view of the session. The proxy refreshes tokens before
 * the request reaches here (docs/design.md §5.5). Returns null if there is no usable session.
 */
export async function getAuth(): Promise<Auth | null> {
  const { access, refresh } = await readSession()
  if (!access || !refresh) return null
  return { accessToken: access.accessToken, username: refresh.username }
}

/** The signed-in username without requiring a live access token. */
export async function getUsername(): Promise<string | null> {
  return (await readSession()).refresh?.username ?? null
}

/**
 * Returns the session. If there is no session at all, the request ends by
 * signing the user out. If the user is signed in but the token is unusable,
 * it throws a retryable error.
 */
export async function requireAuth(): Promise<Auth> {
  const { access, refresh } = await readSession()
  if (!refresh) redirect('/api/auth/signout?reason=expired')
  if (!access) throw new SessionUnavailableError()
  return { accessToken: access.accessToken, username: refresh.username }
}
