import {Shell} from '@/components/layout/Shell/Shell'
import BackToTop from '@/components/ui/BackToTop/BackToTop'
import BossButton from '@/components/ui/BossButton/BossButton'
import RouteScrollReset from '@/components/ui/RouteScrollReset/RouteScrollReset'
import SwipeNavigation from '@/components/ui/SwipeNavigation/SwipeNavigation'
import {fetchMultireddits} from '@/lib/actions/reddit/multireddits'
import {fetchUserSubscriptions} from '@/lib/actions/reddit/subreddits'
import {
  fetchFollowedUsers,
  getCurrentUserAvatar
} from '@/lib/actions/reddit/users'
import {getSession, isAuthenticated} from '@/lib/auth/session'

interface MainLayoutProps {
  children: React.ReactNode
}

/**
 * Shared layout for main content routes.
 *
 * Handles:
 * - User data (subscriptions, multireddits, following, avatar)
 * - Shell wrapper with sidebar navigation
 * - Utility buttons (Boss button, Back to top, Swipe navigation)
 *
 * Applied to: /, /r/[subreddit], /search/[query], /u/[username], /user/[username]/saved, /user/[username]/m/[multiname]
 */
export default async function MainLayout({
  children
}: Readonly<MainLayoutProps>) {
  const authenticated = await isAuthenticated()

  if (!authenticated) {
    return (
      <>
        <Shell>{children}</Shell>
        <RouteScrollReset />
        <SwipeNavigation />
        <BossButton />
        <BackToTop />
      </>
    )
  }

  const session = await getSession()

  const [subscriptions, multireddits, following, avatarUrl] = await Promise.all(
    [
      fetchUserSubscriptions(),
      fetchMultireddits(),
      fetchFollowedUsers(),
      getCurrentUserAvatar()
    ]
  )

  return (
    <>
      <Shell
        username={session.username}
        avatarUrl={avatarUrl ?? undefined}
        subscriptions={subscriptions}
        multireddits={multireddits}
        following={following}
      >
        {children}
      </Shell>
      <RouteScrollReset />
      <SwipeNavigation />
      <BossButton />
      <BackToTop />
    </>
  )
}
