/**
 * Touch gesture detection utilities.
 *
 * Provides reusable gesture detection logic for swipe interactions.
 */

/**
 * Represents a detected swipe gesture.
 */
export interface SwipeEvent {
  /** Direction of the swipe */
  direction: 'left' | 'right' | 'up' | 'down'
  /** Horizontal distance traveled (absolute value) */
  deltaX: number
  /** Vertical distance traveled (absolute value) */
  deltaY: number
}

/**
 * Detects swipe gestures from touch coordinates.
 *
 * Analyzes touch start and end positions to determine if a valid
 * swipe gesture occurred, considering threshold and vertical movement constraints.
 *
 * @param startX - Touch start X coordinate
 * @param startY - Touch start Y coordinate
 * @param endX - Touch end X coordinate
 * @param endY - Touch end Y coordinate
 * @param threshold - Minimum horizontal distance for valid swipe (default: 100px)
 * @param maxVerticalMovement - Maximum vertical movement allowed (default: 50px)
 * @returns SwipeEvent if valid swipe detected, null otherwise
 *
 * @example
 * ```typescript
 * const swipe = detectSwipe(50, 100, 200, 110, 100, 50)
 * if (swipe?.direction === 'right') {
 *   router.back()
 * }
 * ```
 */
export function detectSwipe(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  threshold: number = 100,
  maxVerticalMovement: number = 50
): SwipeEvent | null {
  const deltaX = endX - startX
  const deltaY = Math.abs(endY - startY)

  // Too much vertical movement - likely a scroll
  if (deltaY >= maxVerticalMovement) {
    return null
  }

  // Not enough horizontal movement - not a swipe
  if (Math.abs(deltaX) <= threshold) {
    return null
  }

  // Determine direction based on horizontal movement
  const direction = deltaX > 0 ? 'right' : 'left'

  return {
    direction,
    deltaX: Math.abs(deltaX),
    deltaY
  }
}
