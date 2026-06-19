'use client'

import {detectSwipe} from '@/lib/utils/touch-gestures'
import {useRouter} from 'next/navigation'
import {useEffect, useRef} from 'react'

/**
 * Options for useSwipeNavigation hook.
 */
interface UseSwipeNavigationOptions {
  /** Whether swipe gestures are enabled (default: true) */
  enabled?: boolean
  /** Minimum swipe distance in pixels to trigger navigation (default: 100) */
  threshold?: number
  /** Maximum vertical movement allowed for horizontal swipe (default: 50) */
  maxVerticalMovement?: number
}

/**
 * Custom hook to enable swipe gestures for navigation on mobile.
 *
 * Gestures:
 * - Swipe right (left to right): Navigate back to previous page
 *
 * Features:
 * - Configurable threshold and sensitivity
 * - Prevents accidental triggers with vertical movement check
 * - Only active on touch-enabled devices
 * - Can be disabled via enabled option
 *
 * @param options - Configuration options
 *
 * @example
 * ```typescript
 * // Basic usage - enable swipe back only
 * useSwipeNavigation()
 *
 * // Custom threshold
 * useSwipeNavigation({ threshold: 150 })
 * ```
 */
export function useSwipeNavigation({
  enabled = true,
  threshold = 100,
  maxVerticalMovement = 50
}: UseSwipeNavigationOptions = {}) {
  const router = useRouter()
  const touchStartX = useRef<number>(0)
  const touchStartY = useRef<number>(0)
  const touchEndX = useRef<number>(0)
  const touchEndY = useRef<number>(0)
  const touchTarget = useRef<EventTarget | null>(null)

  useEffect(() => {
    if (!enabled) return

    // Defined inside effect so it is stable and excluded from the dep array.
    const handleSwipeRight = () => router.back()

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0].clientX
      touchStartY.current = e.touches[0].clientY
      touchTarget.current = e.target
    }

    const handleTouchMove = (e: TouchEvent) => {
      touchEndX.current = e.touches[0].clientX
      touchEndY.current = e.touches[0].clientY
    }

    const handleTouchEnd = () => {
      // Skip navigation if the touch originated on a video element
      // (e.g., user is scrubbing through video playback)
      if (
        touchTarget.current instanceof HTMLElement &&
        touchTarget.current.closest('video')
      ) {
        resetTouchState()
        return
      }

      const swipe = detectSwipe(
        touchStartX.current,
        touchStartY.current,
        touchEndX.current,
        touchEndY.current,
        threshold,
        maxVerticalMovement
      )

      if (!swipe) {
        resetTouchState()
        return
      }

      // Right swipe: navigate back
      if (swipe.direction === 'right') {
        handleSwipeRight()
        resetTouchState()
        return
      }

      resetTouchState()
    }

    const resetTouchState = () => {
      touchStartX.current = 0
      touchStartY.current = 0
      touchEndX.current = 0
      touchEndY.current = 0
      touchTarget.current = null
    }

    // Add event listeners — all passive since none call preventDefault().
    document.addEventListener('touchstart', handleTouchStart, {passive: true})
    document.addEventListener('touchmove', handleTouchMove, {passive: true})
    document.addEventListener('touchend', handleTouchEnd, {passive: true})

    // Cleanup
    return () => {
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
    }
  }, [enabled, threshold, maxVerticalMovement, router])
}
