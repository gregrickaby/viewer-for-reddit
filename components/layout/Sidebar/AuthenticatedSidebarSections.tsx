import {SidebarPersonalizedSections} from '@/components/layout/Sidebar/SidebarPersonalizedSections'
import {fetchMultireddits} from '@/lib/actions/reddit/multireddits'
import {fetchUserSubscriptions} from '@/lib/actions/reddit/subreddits'
import {fetchFollowedUsers} from '@/lib/actions/reddit/users'
import {isAuthenticated} from '@/lib/auth/session'

/**
 * Resolves subscriptions/multireddits/following, then renders the sidebar's
 * personalized sections. Reads `cookies()` via `isAuthenticated`, so the
 * caller wraps this in `<Suspense>`.
 */
export async function AuthenticatedSidebarSections() {
  const authenticated = await isAuthenticated()

  if (!authenticated) {
    return null
  }

  const [subscriptions, multireddits, following] = await Promise.all([
    fetchUserSubscriptions(),
    fetchMultireddits(),
    fetchFollowedUsers()
  ])

  return (
    <SidebarPersonalizedSections
      subscriptions={subscriptions}
      multireddits={multireddits}
      following={following}
    />
  )
}
