'use client'

import styles from '@/components/layout/Shell/Shell.module.css'
import {SidebarMobileCloseOnNavigate} from '@/components/layout/Sidebar/SidebarMobileCloseOnNavigate'
import {SidebarNav} from '@/components/layout/Sidebar/SidebarNav'
import {useSidebar} from '@/components/layout/Sidebar/SidebarContext'
import {ScrollArea, Stack} from '@mantine/core'
import {useMediaQuery} from '@mantine/hooks'
import {Suspense, useEffect, useState} from 'react'

interface SidebarPanelProps {
  /** Popular/All/Saved -- see {@link SidebarNav}. Pre-wrapped in `<Suspense>` by the caller. */
  personalizedLinksSlot: React.ReactNode
  /** My Multireddits/My Subreddits/Following. Pre-wrapped in `<Suspense>` by the caller. */
  personalizedSectionsSlot: React.ReactNode
}

/**
 * Client wrapper for the sidebar that controls visibility based on sidebar
 * context state, and handles the mobile overlay. Fully static otherwise --
 * the two personalization slots are the caller's responsibility to defer.
 */
export function SidebarPanel({
  personalizedLinksSlot,
  personalizedSectionsSlot
}: Readonly<SidebarPanelProps>) {
  const {mobileOpen, desktopOpen, closeMobile} = useSidebar()
  const isMobile = useMediaQuery('(max-width: 48em)')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Before mount, leave data-hidden unset so CSS handles the initial state:
  // mobile defaults to hidden (transform: translateX(-100%)), desktop to visible.
  // This prevents a flash of the open sidebar on mobile during hydration.
  const sidebarOpen = isMobile ? mobileOpen : desktopOpen
  const hidden = mounted ? !sidebarOpen : undefined

  return (
    <>
      <Suspense fallback={null}>
        <SidebarMobileCloseOnNavigate onNavigate={closeMobile} />
      </Suspense>

      <aside
        className={styles.sidebar}
        data-hidden={hidden === undefined ? undefined : String(hidden)}
        aria-label="Sidebar navigation"
        style={{viewTransitionName: 'persistent-sidebar'}}
      >
        <ScrollArea type="auto" offsetScrollbars>
          <Stack gap="md">
            <SidebarNav personalizedLinksSlot={personalizedLinksSlot} />
            {personalizedSectionsSlot}
          </Stack>
        </ScrollArea>
      </aside>

      {/* Mobile backdrop overlay */}
      <button
        type="button"
        className={styles.overlay}
        data-visible={String(mounted && isMobile && mobileOpen)}
        onClick={closeMobile}
        onKeyDown={(e) => {
          if (e.key === 'Escape') closeMobile()
        }}
        tabIndex={-1}
        aria-label="Close sidebar"
      />
    </>
  )
}
