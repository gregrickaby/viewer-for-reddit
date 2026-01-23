'use client'

import {useSwipeBack} from '@/lib/hooks'
import {usePathname} from 'next/navigation'

/**
 * SwipeBack component - enables swipe-left-to-go-back gesture on mobile.
 *
 * Mimics native Reddit app behavior where swiping left navigates back
 * to the previous page. This component is automatically disabled on
 * the homepage to prevent accidentally leaving the site.
 *
 * Features:
 * - Detects left swipe gesture (right to left)
 * - Automatically disabled on homepage
 * - Only works on touch-enabled devices
 * - No visual UI, just gesture handling
 *
 * Usage:
 * Add this component to any page where you want swipe-back functionality.
 * It should be placed outside the main layout to avoid interfering with
 * other touch interactions.
 *
 * @example
 * ```typescript
 * <AppLayout>
 *   {children}
 * </AppLayout>
 * <SwipeBack />
 * <BossButton />
 * <BackToTop />
 * ```
 */
export default function SwipeBack() {
  const pathname = usePathname()
  const isHomePage = pathname === '/'

  // Only enable swipe back when NOT on homepage
  useSwipeBack({
    enabled: !isHomePage
  })

  // This is a gesture handler only, no visual UI
  return null
}
