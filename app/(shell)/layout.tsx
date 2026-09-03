import {AuthenticatedRecentPostsRail} from '@/components/layout/RecentPostsRail/AuthenticatedRecentPostsRail'
import {Shell} from '@/components/layout/Shell/Shell'
import {AuthenticatedSidebarSections} from '@/components/layout/Sidebar/AuthenticatedSidebarSections'
import {PersonalizedNavLinks} from '@/components/layout/Sidebar/PersonalizedNavLinks'
import {SidebarPanel} from '@/components/layout/Sidebar/SidebarPanel'
import {SidebarSectionsSkeleton} from '@/components/skeletons/SidebarSectionsSkeleton/SidebarSectionsSkeleton'
import BackToTop from '@/components/ui/BackToTop/BackToTop'
import BossButton from '@/components/ui/BossButton/BossButton'
import RevalidateOnFocus from '@/components/ui/RevalidateOnFocus/RevalidateOnFocus'
import {Suspense} from 'react'

interface MainLayoutProps {
  children: React.ReactNode
}

/**
 * Shared layout for main content routes.
 *
 * Handles:
 * - Shell wrapper (static header + sidebar + main content area + right rail)
 * - Sidebar personalization (feed links, subscriptions, multireddits,
 *   following), each deferred behind its own Suspense boundary
 * - Recent Posts rail, gated behind auth, deferred behind its own
 *   Suspense boundary
 * - Utility buttons (Boss button, Back to top)
 * - Revalidate on focus, refreshing stale content after the tab was hidden
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
        railSlot={
          <Suspense fallback={null}>
            <AuthenticatedRecentPostsRail />
          </Suspense>
        }
      >
        {children}
      </Shell>
      <Suspense fallback={null}>
        <RevalidateOnFocus />
      </Suspense>
      <BossButton />
      <BackToTop />
    </>
  )
}
