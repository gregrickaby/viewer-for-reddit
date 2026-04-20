import {renderHook} from '@/test-utils'
import {useRouter} from 'next/navigation'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import {useSwipeNavigation} from './useSwipeNavigation'

vi.mock('next/navigation', () => ({
  useRouter: vi.fn()
}))

// jsdom does not ship the Touch constructor — provide a minimal polyfill.
if (typeof Touch === 'undefined') {
  class TouchPolyfill {
    identifier: number
    target: EventTarget
    clientX: number
    clientY: number
    screenX: number = 0
    screenY: number = 0
    pageX: number = 0
    pageY: number = 0
    radiusX: number = 0
    radiusY: number = 0
    rotationAngle: number = 0
    force: number = 0

    constructor(init: {
      identifier: number
      target: EventTarget
      clientX: number
      clientY: number
    }) {
      this.identifier = init.identifier
      this.target = init.target
      this.clientX = init.clientX
      this.clientY = init.clientY
    }
  }
  // @ts-ignore – test polyfill
  globalThis.Touch = TouchPolyfill
}

const mockBack = vi.fn()
const mockUseRouter = vi.mocked(useRouter)

/**
 * Fires a touchstart event on document with the given coordinates.
 */
function fireTouchStart(x: number, y: number): void {
  const touch = new Touch({
    identifier: 1,
    target: document.body,
    clientX: x,
    clientY: y
  })
  document.dispatchEvent(
    new TouchEvent('touchstart', {
      touches: [touch],
      changedTouches: [touch],
      bubbles: true
    })
  )
}

/**
 * Fires a touchmove event on document with the given coordinates.
 */
function fireTouchMove(x: number, y: number): void {
  const touch = new Touch({
    identifier: 1,
    target: document.body,
    clientX: x,
    clientY: y
  })
  document.dispatchEvent(
    new TouchEvent('touchmove', {
      touches: [touch],
      changedTouches: [touch],
      bubbles: true
    })
  )
}

/**
 * Fires a touchend event on document.
 */
function fireTouchEnd(): void {
  document.dispatchEvent(
    new TouchEvent('touchend', {
      touches: [],
      changedTouches: [],
      bubbles: true
    })
  )
}

/**
 * Performs a complete right swipe gesture (startX → startX + distance).
 */
function swipeRight(
  startX = 50,
  startY = 200,
  distance = 150,
  verticalDrift = 0
): void {
  fireTouchStart(startX, startY)
  fireTouchMove(startX + distance, startY + verticalDrift)
  fireTouchEnd()
}

/**
 * Performs a complete left swipe gesture (startX → startX - distance).
 */
function swipeLeft(
  startX = 300,
  startY = 200,
  distance = 150,
  verticalDrift = 0
): void {
  fireTouchStart(startX, startY)
  fireTouchMove(startX - distance, startY + verticalDrift)
  fireTouchEnd()
}

describe('useSwipeNavigation', () => {
  beforeEach(() => {
    mockUseRouter.mockReturnValue({
      back: mockBack,
      forward: vi.fn(),
      push: vi.fn(),
      replace: vi.fn(),
      refresh: vi.fn(),
      prefetch: vi.fn()
    })
  })

  afterEach(() => {
    mockBack.mockClear()
  })

  describe('default behavior', () => {
    it('renders without errors using default options', () => {
      expect(() => renderHook(() => useSwipeNavigation())).not.toThrow()
    })

    it('calls router.back() on a valid right swipe', () => {
      renderHook(() => useSwipeNavigation())

      swipeRight()

      expect(mockBack).toHaveBeenCalledTimes(1)
    })

    it('does not call router.back() on a left swipe', () => {
      renderHook(() => useSwipeNavigation())

      swipeLeft()

      expect(mockBack).not.toHaveBeenCalled()
    })
  })

  describe('threshold', () => {
    it('does not navigate when horizontal distance is below default threshold', () => {
      renderHook(() => useSwipeNavigation())

      // 99px — just under the 100px default threshold
      swipeRight(50, 200, 99)

      expect(mockBack).not.toHaveBeenCalled()
    })

    it('does not navigate when horizontal distance equals the threshold', () => {
      renderHook(() => useSwipeNavigation())

      // detectSwipe uses `<=` so exactly 100px should not trigger
      swipeRight(50, 200, 100)

      expect(mockBack).not.toHaveBeenCalled()
    })

    it('navigates when horizontal distance is one pixel over the threshold', () => {
      renderHook(() => useSwipeNavigation())

      swipeRight(50, 200, 101)

      expect(mockBack).toHaveBeenCalledTimes(1)
    })

    it('respects a custom threshold', () => {
      renderHook(() => useSwipeNavigation({threshold: 50}))

      // 60px — over the custom 50px threshold
      swipeRight(50, 200, 60)

      expect(mockBack).toHaveBeenCalledTimes(1)
    })

    it('does not navigate when below a custom threshold', () => {
      renderHook(() => useSwipeNavigation({threshold: 200}))

      // Default 150px swipe — below the 200px custom threshold
      swipeRight()

      expect(mockBack).not.toHaveBeenCalled()
    })
  })

  describe('vertical movement', () => {
    it('does not navigate when vertical drift exceeds default maxVerticalMovement', () => {
      renderHook(() => useSwipeNavigation())

      // 51px vertical — over the 50px default limit
      swipeRight(50, 200, 150, 51)

      expect(mockBack).not.toHaveBeenCalled()
    })

    it('does not navigate when vertical drift equals maxVerticalMovement', () => {
      renderHook(() => useSwipeNavigation())

      // detectSwipe uses `>=` so exactly 50px should not trigger
      swipeRight(50, 200, 150, 50)

      expect(mockBack).not.toHaveBeenCalled()
    })

    it('navigates when vertical drift is within the limit', () => {
      renderHook(() => useSwipeNavigation())

      // 49px vertical — just under the 50px limit
      swipeRight(50, 200, 150, 49)

      expect(mockBack).toHaveBeenCalledTimes(1)
    })

    it('respects a custom maxVerticalMovement', () => {
      renderHook(() => useSwipeNavigation({maxVerticalMovement: 20}))

      // 25px vertical — over the custom 20px limit
      swipeRight(50, 200, 150, 25)

      expect(mockBack).not.toHaveBeenCalled()
    })

    it('handles negative vertical drift (upward swipe component)', () => {
      renderHook(() => useSwipeNavigation())

      // -30px vertical (swipe goes slightly upward) — within 50px limit
      swipeRight(50, 200, 150, -30)

      expect(mockBack).toHaveBeenCalledTimes(1)
    })
  })

  describe('enabled option', () => {
    it('does not register listeners when enabled is false', () => {
      renderHook(() => useSwipeNavigation({enabled: false}))

      swipeRight()

      expect(mockBack).not.toHaveBeenCalled()
    })

    it('registers listeners when enabled is true (explicit)', () => {
      renderHook(() => useSwipeNavigation({enabled: true}))

      swipeRight()

      expect(mockBack).toHaveBeenCalledTimes(1)
    })
  })

  describe('touchend without prior touchmove', () => {
    it('does not navigate when touchend fires with no touchmove (coordinates stay at 0,0)', () => {
      renderHook(() => useSwipeNavigation())

      // Only touchstart + touchend; touchmove never fired, so endX/endY stay at 0.
      // Both startX and endX are 0, giving deltaX=0 which is below threshold.
      fireTouchStart(50, 200)
      fireTouchEnd()

      expect(mockBack).not.toHaveBeenCalled()
    })
  })

  describe('cleanup', () => {
    it('removes event listeners on unmount and does not call router.back() afterward', () => {
      const {unmount} = renderHook(() => useSwipeNavigation())

      unmount()

      swipeRight()

      expect(mockBack).not.toHaveBeenCalled()
    })
  })

  describe('multiple swipes', () => {
    it('calls router.back() for each valid right swipe', () => {
      renderHook(() => useSwipeNavigation())

      swipeRight()
      swipeRight()
      swipeRight()

      expect(mockBack).toHaveBeenCalledTimes(3)
    })

    it('resets touch state between gestures so prior coordinates do not bleed over', () => {
      renderHook(() => useSwipeNavigation())

      // First swipe: valid right swipe
      swipeRight()
      expect(mockBack).toHaveBeenCalledTimes(1)

      // Second gesture: only touchstart fires, no touchmove, then touchend.
      // If state reset correctly, endX == 0 and deltaX won't meet threshold.
      fireTouchStart(50, 200)
      fireTouchEnd()

      // Still only 1 call — the second gesture should not have triggered
      expect(mockBack).toHaveBeenCalledTimes(1)
    })
  })
})
