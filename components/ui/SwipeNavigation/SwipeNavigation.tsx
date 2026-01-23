'use client'

import {useSwipeNavigation} from '@/lib/hooks'
import {usePathname} from 'next/navigation'

/**
 * SwipeNavigation component - enables swipe gestures for navigation on mobile.
 *
 * Gestures:
 * - Swipe right: Navigate back to previous page
 *
 * Features:
 * - Automatically disabled on homepage
 * - Only works on touch-enabled devices
 * - No visual UI, just gesture handling
 *
 * Usage:
 * Add this component to any page where you want swipe navigation.
 * It should be placed outside the main layout to avoid interfering with
 * other touch interactions.
 *
 * @example
 * ```typescript
 * <AppLayout>
 *   {children}
 * </AppLayout>
 * <SwipeNavigation />
 * <BossButton />
 * <BackToTop />
 * ```
 */
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
