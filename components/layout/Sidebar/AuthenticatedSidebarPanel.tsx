import {SidebarPanel} from '@/components/layout/Sidebar/SidebarPanel'
import {fetchMultireddits} from '@/lib/actions/reddit/multireddits'
import {fetchUserSubscriptions} from '@/lib/actions/reddit/subreddits'
import {fetchFollowedUsers} from '@/lib/actions/reddit/users'
import {getSession, isAuthenticated} from '@/lib/auth/session'

/**
 * Resolves the session and personalization data (subscriptions,
 * multireddits, following) for the sidebar, then renders it. Reads
 * `cookies()` (via `isAuthenticated`/`getSession`) and `SidebarPanel`'s own
 * `usePathname()` call, so callers must wrap this in `<Suspense>` to keep
 * the rest of the route prerenderable.
 */
export async function AuthenticatedSidebarPanel() {
  const authenticated = await isAuthenticated()

  if (!authenticated) {
    return <SidebarPanel />
  }

  const session = await getSession()

  const [subscriptions, multireddits, following] = await Promise.all([
    fetchUserSubscriptions(),
    fetchMultireddits(),
    fetchFollowedUsers()
  ])

  return (
    <SidebarPanel
      username={session.username}
      subscriptions={subscriptions}
      multireddits={multireddits}
      following={following}
    />
  )
}
