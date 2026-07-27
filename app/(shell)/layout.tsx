import {Shell} from '@/components/layout/Shell/Shell'
import {AuthenticatedSidebarPanel} from '@/components/layout/Sidebar/AuthenticatedSidebarPanel'
import {SidebarPanelSkeleton} from '@/components/skeletons/SidebarPanelSkeleton/SidebarPanelSkeleton'
import BackToTop from '@/components/ui/BackToTop/BackToTop'
import BossButton from '@/components/ui/BossButton/BossButton'
import RouteScrollReset from '@/components/ui/RouteScrollReset/RouteScrollReset'
import SwipeNavigation from '@/components/ui/SwipeNavigation/SwipeNavigation'
import {Suspense} from 'react'

interface MainLayoutProps {
  children: React.ReactNode
}

/**
 * Shared layout for main content routes.
 *
 * Handles:
 * - Shell wrapper (static header + sidebar slot + main content area)
 * - Sidebar personalization (subscriptions, multireddits, following) via
 *   AuthenticatedSidebarPanel, deferred behind its own Suspense boundary
 * - Utility buttons (Boss button, Back to top, Swipe navigation)
 *
 * Applied to: /, /r/[subreddit], /search/[query], /u/[username], /user/[username]/saved, /user/[username]/m/[multiname]
 */
export default function MainLayout({children}: Readonly<MainLayoutProps>) {
  return (
    <>
      <Shell
        sidebarSlot={
          <Suspense fallback={<SidebarPanelSkeleton />}>
            <AuthenticatedSidebarPanel />
          </Suspense>
        }
      >
        {children}
      </Shell>
      <Suspense fallback={null}>
        <RouteScrollReset />
      </Suspense>
      <Suspense fallback={null}>
        <SwipeNavigation />
      </Suspense>
      <BossButton />
      <BackToTop />
    </>
  )
}
