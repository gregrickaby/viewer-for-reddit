'use client'

import {usePathname} from 'next/navigation'
import {useEffect, useRef} from 'react'

interface SidebarMobileCloseOnNavigateProps {
  onNavigate: () => void
}

/**
 * Closes the mobile sidebar overlay on route change. Isolated into its own
 * leaf (rather than living directly in `SidebarPanel`) because `usePathname`
 * blocks prerendering on routes with dynamic segments unless the component
 * reading it sits behind its own `<Suspense>` -- same treatment as
 * `RouteScrollReset`/`SwipeNavigation`. Renders no UI.
 */
export function SidebarMobileCloseOnNavigate({
  onNavigate
}: Readonly<SidebarMobileCloseOnNavigateProps>) {
  const pathname = usePathname()
  const prevPathname = useRef(pathname)

  useEffect(() => {
    if (pathname !== prevPathname.current) {
      prevPathname.current = pathname
      onNavigate()
    }
  }, [pathname, onNavigate])

  return null
}
