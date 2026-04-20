'use client'

import {Burger} from '@mantine/core'
import {useSidebar} from './SidebarContext'

/** Sidebar toggle buttons for mobile and desktop breakpoints. */
export function SidebarToggle() {
  const {mobileOpen, toggleMobile, toggleDesktop} = useSidebar()

  return (
    <>
      <Burger
        opened={mobileOpen}
        onClick={toggleMobile}
        hiddenFrom="sm"
        size="sm"
        aria-label="Toggle mobile navigation"
        data-umami-event="toggle-mobile-nav"
      />
      <Burger
        opened={false}
        onClick={toggleDesktop}
        visibleFrom="sm"
        size="sm"
        aria-label="Toggle desktop navigation"
        data-umami-event="toggle-desktop-nav"
      />
    </>
  )
}
