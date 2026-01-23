import {renderHook} from '@/test-utils'
import {beforeEach, describe, expect, it, vi} from 'vitest'
import {useSwipeBack} from './useSwipeBack'

const mockBack = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    back: mockBack,
    push: vi.fn(),
    refresh: vi.fn()
  })
}))

describe('useSwipeBack', () => {
  beforeEach(() => {
    mockBack.mockClear()
  })

  const simulateSwipe = (
    startX: number,
    startY: number,
    endX: number,
    endY: number
  ) => {
    const touchStartEvent = new TouchEvent('touchstart', {
      touches: [{clientX: startX, clientY: startY} as Touch]
    })
    const touchMoveEvent = new TouchEvent('touchmove', {
      touches: [{clientX: endX, clientY: endY} as Touch]
    })
    const touchEndEvent = new TouchEvent('touchend')

    document.dispatchEvent(touchStartEvent)
    document.dispatchEvent(touchMoveEvent)
    document.dispatchEvent(touchEndEvent)
  }

  describe('left swipe detection', () => {
    it('navigates back on left swipe exceeding threshold', () => {
      renderHook(() => useSwipeBack())

      // Swipe left: start at 200, end at 50 (delta = -150, exceeds default 100 threshold)
      simulateSwipe(200, 100, 50, 100)

      expect(mockBack).toHaveBeenCalledTimes(1)
    })

    it('does not navigate on left swipe below threshold', () => {
      renderHook(() => useSwipeBack())

      // Swipe left but not enough: start at 100, end at 50 (delta = -50, below 100 threshold)
      simulateSwipe(100, 100, 50, 100)

      expect(mockBack).not.toHaveBeenCalled()
    })

    it('respects custom threshold', () => {
      renderHook(() => useSwipeBack({threshold: 50}))

      // Swipe left: delta = -60, exceeds custom 50 threshold
      simulateSwipe(150, 100, 90, 100)

      expect(mockBack).toHaveBeenCalledTimes(1)
    })

    it('does not navigate on right swipe', () => {
      renderHook(() => useSwipeBack())

      // Swipe right: start at 50, end at 200 (delta = +150)
      simulateSwipe(50, 100, 200, 100)

      expect(mockBack).not.toHaveBeenCalled()
    })

    it('handles exactly threshold distance', () => {
      renderHook(() => useSwipeBack({threshold: 100}))

      // Swipe left: delta = -100, exactly at threshold (should not trigger)
      simulateSwipe(200, 100, 100, 100)

      expect(mockBack).not.toHaveBeenCalled()
    })

    it('handles threshold + 1 distance', () => {
      renderHook(() => useSwipeBack({threshold: 100}))

      // Swipe left: delta = -101, just over threshold (should trigger)
      simulateSwipe(200, 100, 99, 100)

      expect(mockBack).toHaveBeenCalledTimes(1)
    })
  })

  describe('vertical movement constraints', () => {
    it('does not navigate when vertical movement exceeds limit', () => {
      renderHook(() => useSwipeBack())

      // Swipe left with too much vertical movement
      // Horizontal: 200 -> 50 (delta = -150, exceeds threshold)
      // Vertical: 100 -> 160 (delta = 60, exceeds default maxVerticalMovement of 50)
      simulateSwipe(200, 100, 50, 160)

      expect(mockBack).not.toHaveBeenCalled()
    })

    it('navigates when vertical movement is within limit', () => {
      renderHook(() => useSwipeBack())

      // Swipe left with acceptable vertical movement
      // Horizontal: 200 -> 50 (delta = -150)
      // Vertical: 100 -> 130 (delta = 30, within default 50 limit)
      simulateSwipe(200, 100, 50, 130)

      expect(mockBack).toHaveBeenCalledTimes(1)
    })

    it('respects custom maxVerticalMovement', () => {
      renderHook(() => useSwipeBack({maxVerticalMovement: 20}))

      // Vertical movement of 30 exceeds custom limit of 20
      simulateSwipe(200, 100, 50, 130)

      expect(mockBack).not.toHaveBeenCalled()
    })

    it('handles negative vertical movement', () => {
      renderHook(() => useSwipeBack())

      // Swipe left with upward vertical movement
      // Vertical: 100 -> 60 (delta = -40, abs = 40, within 50 limit)
      simulateSwipe(200, 100, 50, 60)

      expect(mockBack).toHaveBeenCalledTimes(1)
    })

    it('handles exactly maxVerticalMovement', () => {
      renderHook(() => useSwipeBack({maxVerticalMovement: 50}))

      // Vertical: exactly 50 (should not trigger)
      simulateSwipe(200, 100, 50, 150)

      expect(mockBack).not.toHaveBeenCalled()
    })
  })

  describe('enabled/disabled state', () => {
    it('navigates when enabled is true', () => {
      renderHook(() => useSwipeBack({enabled: true}))

      simulateSwipe(200, 100, 50, 100)

      expect(mockBack).toHaveBeenCalledTimes(1)
    })

    it('does not navigate when enabled is false', () => {
      renderHook(() => useSwipeBack({enabled: false}))

      simulateSwipe(200, 100, 50, 100)

      expect(mockBack).not.toHaveBeenCalled()
    })

    it('does not add event listeners when disabled', () => {
      const addEventListenerSpy = vi.spyOn(document, 'addEventListener')
      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener')

      const {unmount} = renderHook(() => useSwipeBack({enabled: false}))

      // Should not add listeners when disabled
      expect(addEventListenerSpy).not.toHaveBeenCalled()

      unmount()

      // Should not try to remove listeners that were never added
      expect(removeEventListenerSpy).not.toHaveBeenCalled()

      addEventListenerSpy.mockRestore()
      removeEventListenerSpy.mockRestore()
    })
  })

  describe('event listener cleanup', () => {
    it('removes event listeners on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener')

      const {unmount} = renderHook(() => useSwipeBack())

      unmount()

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'touchstart',
        expect.any(Function)
      )
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'touchmove',
        expect.any(Function)
      )
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'touchend',
        expect.any(Function)
      )

      removeEventListenerSpy.mockRestore()
    })

    it('does not trigger navigation after unmount', () => {
      const {unmount} = renderHook(() => useSwipeBack())

      unmount()

      // Try to swipe after unmount
      simulateSwipe(200, 100, 50, 100)

      expect(mockBack).not.toHaveBeenCalled()
    })
  })

  describe('multiple swipes', () => {
    it('handles multiple consecutive swipes', () => {
      renderHook(() => useSwipeBack())

      simulateSwipe(200, 100, 50, 100)
      simulateSwipe(200, 100, 50, 100)
      simulateSwipe(200, 100, 50, 100)

      expect(mockBack).toHaveBeenCalledTimes(3)
    })

    it('resets state between swipes', () => {
      renderHook(() => useSwipeBack())

      // First swipe - should trigger
      simulateSwipe(200, 100, 50, 100)
      expect(mockBack).toHaveBeenCalledTimes(1)

      // Second swipe with different values - should also trigger
      simulateSwipe(300, 200, 100, 200)
      expect(mockBack).toHaveBeenCalledTimes(2)
    })
  })

  describe('edge cases', () => {
    it('handles zero start position', () => {
      renderHook(() => useSwipeBack())

      // Start at 0, swipe left is not possible (would be negative)
      // But swipe from 150 to 0 should work
      simulateSwipe(150, 100, 0, 100)

      expect(mockBack).toHaveBeenCalledTimes(1)
    })

    it('handles very large swipe distances', () => {
      renderHook(() => useSwipeBack())

      // Very long swipe
      simulateSwipe(1000, 100, 0, 100)

      expect(mockBack).toHaveBeenCalledTimes(1)
    })

    it('handles zero vertical movement', () => {
      renderHook(() => useSwipeBack())

      // Perfectly horizontal swipe
      simulateSwipe(200, 100, 50, 100)

      expect(mockBack).toHaveBeenCalledTimes(1)
    })

    it('handles default options', () => {
      renderHook(() => useSwipeBack())

      // Should work with defaults: threshold=100, maxVerticalMovement=50
      simulateSwipe(200, 100, 50, 120)

      expect(mockBack).toHaveBeenCalledTimes(1)
    })

    it('handles all custom options together', () => {
      renderHook(() =>
        useSwipeBack({
          enabled: true,
          threshold: 75,
          maxVerticalMovement: 30
        })
      )

      // Swipe: delta = -100 (exceeds 75), vertical = 20 (within 30)
      simulateSwipe(200, 100, 100, 120)

      expect(mockBack).toHaveBeenCalledTimes(1)
    })
  })
})
