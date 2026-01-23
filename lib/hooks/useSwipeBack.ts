'use client'

import {useRouter} from 'next/navigation'
import {useEffect, useRef} from 'react'

/**
 * Options for useSwipeBack hook.
 */
interface UseSwipeBackOptions {
  /** Whether the swipe back gesture is enabled (default: true) */
  enabled?: boolean
  /** Minimum swipe distance in pixels to trigger navigation (default: 100) */
  threshold?: number
  /** Maximum vertical movement allowed for horizontal swipe (default: 50) */
  maxVerticalMovement?: number
}

/**
 * Custom hook to enable swipe-right-to-go-back gesture on mobile.
 *
 * Mimics native app behavior where swiping right navigates back
 * to the previous page. Only works on touch devices.
 *
 * Features:
 * - Detects right swipe gesture (left to right)
 * - Configurable threshold and sensitivity
 * - Prevents accidental triggers with vertical movement check
 * - Only active on touch-enabled devices
 * - Can be disabled via enabled option
 *
 * @param options - Configuration options
 *
 * @example
 * ```typescript
 * // Basic usage - enable swipe back on page
 * useSwipeBack()
 *
 * // Custom threshold
 * useSwipeBack({ threshold: 150 })
 *
 * // Conditionally enable
 * useSwipeBack({ enabled: !isHomePage })
 * ```
 */
export function useSwipeBack({
  enabled = true,
  threshold = 100,
  maxVerticalMovement = 50
}: UseSwipeBackOptions = {}) {
  const router = useRouter()
  const touchStartX = useRef<number>(0)
  const touchStartY = useRef<number>(0)
  const touchEndX = useRef<number>(0)
  const touchEndY = useRef<number>(0)

  useEffect(() => {
    if (!enabled) return

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0].clientX
      touchStartY.current = e.touches[0].clientY
    }

    const handleTouchMove = (e: TouchEvent) => {
      touchEndX.current = e.touches[0].clientX
      touchEndY.current = e.touches[0].clientY
    }

    const handleTouchEnd = () => {
      const deltaX = touchEndX.current - touchStartX.current
      const deltaY = Math.abs(touchEndY.current - touchStartY.current)

      // Check if it's a right swipe (positive deltaX means swiping right)
      // and vertical movement is minimal (not a scroll)
      if (deltaX > threshold && deltaY < maxVerticalMovement) {
        router.back()
      }

      // Reset values
      touchStartX.current = 0
      touchStartY.current = 0
      touchEndX.current = 0
      touchEndY.current = 0
    }

    // Add event listeners
    document.addEventListener('touchstart', handleTouchStart, {passive: true})
    document.addEventListener('touchmove', handleTouchMove, {passive: true})
    document.addEventListener('touchend', handleTouchEnd)

    // Cleanup
    return () => {
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
    }
  }, [enabled, router, threshold, maxVerticalMovement])
}
