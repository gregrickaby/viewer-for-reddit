import {PersonalizedNavLinksView} from '@/components/layout/Sidebar/PersonalizedNavLinksView'
import {getSession, isAuthenticated} from '@/lib/auth/session'

/**
 * Resolves auth state, then renders the Popular/All/Saved feed links.
 * Reddit's API requires an authenticated user context, so these only render
 * once signed in. Reads `cookies()` via `isAuthenticated`, so the caller
 * wraps this in `<Suspense>`.
 */
export async function PersonalizedNavLinks() {
  const authenticated = await isAuthenticated()

  if (!authenticated) {
    return null
  }

  const session = await getSession()

  return <PersonalizedNavLinksView username={session.username ?? ''} />
}
