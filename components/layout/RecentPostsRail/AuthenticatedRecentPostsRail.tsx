import {RecentPostsRail} from '@/components/layout/RecentPostsRail/RecentPostsRail'
import {isAuthenticated} from '@/lib/auth/session'

/**
 * Gates the Recent Posts rail behind auth. Reads `cookies()` via
 * `isAuthenticated`, so the caller wraps this in `<Suspense>`.
 */
export async function AuthenticatedRecentPostsRail() {
  const authenticated = await isAuthenticated()

  if (!authenticated) {
    return null
  }

  return <RecentPostsRail />
}
