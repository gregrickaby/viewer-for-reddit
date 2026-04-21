'use client'

import styles from '@/components/layout/Shell/Shell.module.css'
import {Sidebar} from '@/components/layout/Sidebar/Sidebar'
import {useSidebar} from '@/components/layout/Sidebar/SidebarContext'
import type {ManagedMultireddit} from '@/lib/hooks/useMultiredditManager'
import type {ManagedSubscription} from '@/lib/hooks/useSubredditManager'
import {useMediaQuery} from '@mantine/hooks'
import {usePathname} from 'next/navigation'
import {useEffect, useRef, useState} from 'react'

interface SidebarPanelProps {
  isAuthenticated?: boolean
  username?: string
  subscriptions?: ManagedSubscription[]
  multireddits?: ManagedMultireddit[]
  following?: Array<{
    name: string
    id: string
    date: number
    note?: string
  }>
}

/**
 * Client wrapper for the sidebar that controls visibility based on
 * sidebar context state. Handles mobile overlay and auto-close on
 * route changes.
 */
export function SidebarPanel({
  isAuthenticated,
  username,
  subscriptions,
  multireddits,
  following
}: Readonly<SidebarPanelProps>) {
  const {mobileOpen, desktopOpen, closeMobile} = useSidebar()
  const isMobile = useMediaQuery('(max-width: 48em)')
  const pathname = usePathname()
  const prevPathname = useRef(pathname)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Close mobile sidebar on route change.
  useEffect(() => {
    if (pathname !== prevPathname.current) {
      prevPathname.current = pathname
      closeMobile()
    }
  }, [pathname, closeMobile])

  // Before mount, leave data-hidden unset so CSS handles the initial state:
  // mobile defaults to hidden (transform: translateX(-100%)), desktop to visible.
  // This prevents a flash of the open sidebar on mobile during hydration.
  const sidebarOpen = isMobile ? mobileOpen : desktopOpen
  const hidden = mounted ? !sidebarOpen : undefined

  return (
    <>
      <aside
        className={styles.sidebar}
        data-hidden={hidden === undefined ? undefined : String(hidden)}
        aria-label="Sidebar navigation"
      >
        <Sidebar
          isAuthenticated={isAuthenticated}
          username={username}
          subscriptions={subscriptions}
          multireddits={multireddits}
          following={following}
        />
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
