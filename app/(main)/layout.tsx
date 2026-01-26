import {AppLayout} from '@/components/layout/AppLayout/AppLayout'
import BackToTop from '@/components/ui/BackToTop/BackToTop'
import BossButton from '@/components/ui/BossButton/BossButton'
import SwipeNavigation from '@/components/ui/SwipeNavigation/SwipeNavigation'
import {
  fetchFollowedUsers,
  fetchMultireddits,
  fetchUserSubscriptions,
  getCurrentUserAvatar
} from '@/lib/actions/reddit'
import {getSession} from '@/lib/auth/session'

interface MainLayoutProps {
  children: React.ReactNode
}

/**
 * Shared layout for main content routes.
 *
 * Handles:
 * - Authentication state
 * - User data (subscriptions, multireddits, following, avatar)
 * - AppLayout wrapper with sidebar navigation
 * - Utility buttons (Boss button, Back to top, Swipe navigation)
 *
 * Applied to: /, /r/[subreddit], /search/[query], /u/[username], /user/[username]/saved, /user/[username]/m/[multiname]
 */
export default async function MainLayout({
  children
}: Readonly<MainLayoutProps>) {
  const session = await getSession()
  const isAuthenticated = !!session.accessToken

  const [subscriptions, multireddits, following, avatarUrl] = await Promise.all(
    [
      isAuthenticated ? fetchUserSubscriptions() : Promise.resolve([]),
      isAuthenticated ? fetchMultireddits() : Promise.resolve([]),
      isAuthenticated ? fetchFollowedUsers() : Promise.resolve([]),
      isAuthenticated ? getCurrentUserAvatar() : Promise.resolve(null)
    ]
  )

  return (
    <>
      <AppLayout
        isAuthenticated={isAuthenticated}
        username={session.username}
        avatarUrl={avatarUrl ?? undefined}
        subscriptions={subscriptions}
        multireddits={multireddits}
        following={following}
      >
        {children}
      </AppLayout>
      <SwipeNavigation />
      <BossButton />
      <BackToTop />
    </>
  )
}
