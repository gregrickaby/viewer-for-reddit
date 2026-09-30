'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { ACCESS_COOKIE, REFRESH_COOKIE, unsealRefresh } from '@/lib/auth/cookies'
import { revokeToken } from '@/lib/auth/oauth'
import { logger } from '@/lib/datadog/server'

/**
 * User-initiated sign-out (docs/design.md §5.6): revoke at Reddit (best-effort),
 * clear the session, and return to the landing page.
 */
export async function signOut(): Promise<void> {
  const jar = await cookies()
  const refresh = await unsealRefresh(jar.get(REFRESH_COOKIE)?.value)

  if (refresh && !(await revokeToken(refresh.refreshToken))) {
    logger.warn('[auth] token revocation failed; clearing cookies anyway')
  }

  jar.delete(ACCESS_COOKIE)
  jar.delete(REFRESH_COOKIE)
  redirect('/')
}
