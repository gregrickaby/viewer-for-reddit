'use client'

import {createContext, useContext, useState} from 'react'

interface SidebarState {
  /** Whether the mobile sidebar drawer is open */
  mobileOpen: boolean
  /** Whether the desktop sidebar is open */
  desktopOpen: boolean
  /** Toggle the mobile sidebar drawer */
  toggleMobile: () => void
  /** Toggle the desktop sidebar */
  toggleDesktop: () => void
  /** Close the mobile sidebar (e.g., after navigation) */
  closeMobile: () => void
}

const SidebarContext = createContext<SidebarState | null>(null)

/** Provides sidebar open/close state to descendant components. */
export function SidebarProvider({
  children
}: Readonly<{children: React.ReactNode}>) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [desktopOpen, setDesktopOpen] = useState(true)

  const toggleMobile = () => setMobileOpen((prev) => !prev)
  const toggleDesktop = () => setDesktopOpen((prev) => !prev)
  const closeMobile = () => setMobileOpen(false)

  return (
    <SidebarContext
      value={{
        mobileOpen,
        desktopOpen,
        toggleMobile,
        toggleDesktop,
        closeMobile
      }}
    >
      {children}
    </SidebarContext>
  )
}

/**
 * Access sidebar toggle state from any descendant component.
 *
 * @throws Error if used outside of SidebarProvider.
 */
export function useSidebar(): SidebarState {
  const context = useContext(SidebarContext)
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider')
  }
  return context
}
