import {Shell} from '@/components/layout/Shell/Shell'
import {AuthenticatedSidebarSections} from '@/components/layout/Sidebar/AuthenticatedSidebarSections'
import {PersonalizedNavLinks} from '@/components/layout/Sidebar/PersonalizedNavLinks'
import {SidebarPanel} from '@/components/layout/Sidebar/SidebarPanel'
import {SidebarSectionsSkeleton} from '@/components/skeletons/SidebarSectionsSkeleton/SidebarSectionsSkeleton'
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
 * - Shell wrapper (static header + sidebar + main content area)
 * - Sidebar personalization (feed links, subscriptions, multireddits,
 *   following), each deferred behind its own Suspense boundary
 * - Utility buttons (Boss button, Back to top, Swipe navigation)
 *
 * Applied to: /, /r/[subreddit], /search/[query], /u/[username], /user/[username]/saved, /user/[username]/m/[multiname]
 */
export default function MainLayout({children}: Readonly<MainLayoutProps>) {
  return (
    <>
      <Shell
        sidebarSlot={
          <SidebarPanel
            personalizedLinksSlot={
              <Suspense fallback={null}>
                <PersonalizedNavLinks />
              </Suspense>
            }
            personalizedSectionsSlot={
              <Suspense fallback={<SidebarSectionsSkeleton />}>
                <AuthenticatedSidebarSections />
              </Suspense>
            }
          />
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
