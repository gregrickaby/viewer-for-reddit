'use client'

import {useSwipeNavigation} from '@/lib/hooks/useSwipeNavigation'
import {usePathname} from 'next/navigation'

/** Enables swipe-right gesture for back navigation on mobile. Renders no visual UI. */
export default function SwipeNavigation() {
  const pathname = usePathname()
  const isHomePage = pathname === '/'

  // Enable swipe navigation when NOT on homepage
  useSwipeNavigation({
    enabled: !isHomePage
  })

  // This is a gesture handler only, no visual UI
  return null
}
