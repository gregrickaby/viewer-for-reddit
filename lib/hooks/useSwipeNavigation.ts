'use client'

import {usePostNavigation} from '@/lib/contexts/PostNavigationContext'
import {detectSwipe} from '@/lib/utils/touch-gestures'
import {useRouter} from 'next/navigation'
import {useCallback, useEffect, useRef} from 'react'

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
  /** Enable swipe-left to go to next post (default: false) */
  enableNextPost?: boolean
}

/**
 * Custom hook to enable swipe gestures for navigation on mobile.
 *
 * Gestures:
 * - Swipe right (left to right): Navigate back to previous page
 * - Swipe left (right to left): Navigate to next post in feed (if available)
 *
 * Features:
 * - Configurable threshold and sensitivity
 * - Prevents accidental triggers with vertical movement check
 * - Only active on touch-enabled devices
 * - Integrates with PostNavigationContext for next/previous post
 * - Can be disabled via enabled option
 *
 * @param options - Configuration options
 *
 * @example
 * ```typescript
 * // Basic usage - enable swipe back only
 * useSwipeNavigation()
 *
 * // Enable both back and next post navigation
 * useSwipeNavigation({ enableNextPost: true })
 *
 * // Custom threshold
 * useSwipeNavigation({ threshold: 150, enableNextPost: true })
 * ```
 */
export function useSwipeNavigation({
  enabled = true,
  threshold = 100,
  maxVerticalMovement = 50,
  enableNextPost = false
}: UseSwipeNavigationOptions = {}) {
  const router = useRouter()
  const {getNextPost} = usePostNavigation()
  const touchStartX = useRef<number>(0)
  const touchStartY = useRef<number>(0)
  const touchEndX = useRef<number>(0)
  const touchEndY = useRef<number>(0)

  // Memoized callback for right swipe (back navigation)
  const handleSwipeRight = useCallback(() => {
    router.back()
  }, [router])

  // Memoized callback for left swipe (next post)
  const handleSwipeLeft = useCallback(() => {
    const nextPost = getNextPost()
    if (nextPost) {
      router.push(nextPost.url)
    }
  }, [getNextPost, router])

  // Prefetch next post when available
  useEffect(() => {
    if (enableNextPost && enabled) {
      const nextPost = getNextPost()
      if (nextPost?.url) {
        router.prefetch(nextPost.url)
      }
    }
  }, [enableNextPost, enabled, getNextPost, router])

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

      // Left swipe: navigate to next post (if enabled)
      if (swipe.direction === 'left' && enableNextPost) {
        handleSwipeLeft()
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
  }, [
    enabled,
    threshold,
    maxVerticalMovement,
    enableNextPost,
    handleSwipeRight,
    handleSwipeLeft
  ])
}
