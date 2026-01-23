import {renderHook} from '@/test-utils'
import {beforeEach, describe, expect, it, vi} from 'vitest'
import {useSwipeNavigation} from './useSwipeNavigation'

const mockBack = vi.fn()
const mockPush = vi.fn()
const mockPrefetch = vi.fn()
const mockGetNextPost = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    back: mockBack,
    push: mockPush,
    prefetch: mockPrefetch,
    refresh: vi.fn()
  })
}))

vi.mock('@/lib/contexts/PostNavigationContext', () => ({
  usePostNavigation: () => ({
    getNextPost: mockGetNextPost,
    getPreviousPost: vi.fn(),
    setPosts: vi.fn(),
    setCurrentPostId: vi.fn(),
    posts: [],
    currentPostId: null
  })
}))

describe('useSwipeNavigation', () => {
  beforeEach(() => {
    mockBack.mockClear()
    mockPush.mockClear()
    mockPrefetch.mockClear()
    mockGetNextPost.mockClear()
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

  describe('right swipe (back navigation)', () => {
    it('navigates back on right swipe exceeding threshold', () => {
      renderHook(() => useSwipeNavigation())

      simulateSwipe(50, 100, 200, 100)

      expect(mockBack).toHaveBeenCalledTimes(1)
    })

    it('does not navigate on right swipe below threshold', () => {
      renderHook(() => useSwipeNavigation())

      simulateSwipe(50, 100, 100, 100)

      expect(mockBack).not.toHaveBeenCalled()
    })

    it('respects custom threshold', () => {
      renderHook(() => useSwipeNavigation({threshold: 50}))

      simulateSwipe(90, 100, 150, 100)

      expect(mockBack).toHaveBeenCalledTimes(1)
    })
  })

  describe('left swipe (next post navigation)', () => {
    it('does not navigate to next post when enableNextPost is false', () => {
      mockGetNextPost.mockReturnValue({
        id: 't3_next',
        url: '/r/test/comments/next',
        title: 'Next Post'
      })

      renderHook(() => useSwipeNavigation({enableNextPost: false}))

      simulateSwipe(200, 100, 50, 100)

      expect(mockPush).not.toHaveBeenCalled()
    })

    it('navigates to next post when enableNextPost is true and post available', () => {
      const nextPost = {
        id: 't3_next',
        url: '/r/test/comments/next',
        title: 'Next Post'
      }
      mockGetNextPost.mockReturnValue(nextPost)

      renderHook(() => useSwipeNavigation({enableNextPost: true}))

      simulateSwipe(200, 100, 50, 100)

      expect(mockPush).toHaveBeenCalledWith(nextPost.url)
    })

    it('does not navigate when no next post available', () => {
      mockGetNextPost.mockReturnValue(null)

      renderHook(() => useSwipeNavigation({enableNextPost: true}))

      simulateSwipe(200, 100, 50, 100)

      expect(mockPush).not.toHaveBeenCalled()
    })

    it('does not navigate on left swipe below threshold', () => {
      mockGetNextPost.mockReturnValue({
        id: 't3_next',
        url: '/r/test/comments/next',
        title: 'Next Post'
      })

      renderHook(() => useSwipeNavigation({enableNextPost: true}))

      simulateSwipe(100, 100, 50, 100)

      expect(mockPush).not.toHaveBeenCalled()
    })
  })

  describe('vertical movement constraints', () => {
    it('does not navigate when vertical movement exceeds limit', () => {
      renderHook(() => useSwipeNavigation())

      simulateSwipe(50, 100, 200, 160)

      expect(mockBack).not.toHaveBeenCalled()
    })

    it('navigates when vertical movement is within limit', () => {
      renderHook(() => useSwipeNavigation())

      simulateSwipe(50, 100, 200, 130)

      expect(mockBack).toHaveBeenCalledTimes(1)
    })

    it('respects custom maxVerticalMovement', () => {
      renderHook(() => useSwipeNavigation({maxVerticalMovement: 20}))

      simulateSwipe(50, 100, 200, 130)

      expect(mockBack).not.toHaveBeenCalled()
    })
  })

  describe('enabled/disabled state', () => {
    it('navigates when enabled is true', () => {
      renderHook(() => useSwipeNavigation({enabled: true}))

      simulateSwipe(50, 100, 200, 100)

      expect(mockBack).toHaveBeenCalledTimes(1)
    })

    it('does not navigate when enabled is false', () => {
      renderHook(() => useSwipeNavigation({enabled: false}))

      simulateSwipe(50, 100, 200, 100)

      expect(mockBack).not.toHaveBeenCalled()
    })
  })

  describe('event listener cleanup', () => {
    it('removes event listeners on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener')

      const {unmount} = renderHook(() => useSwipeNavigation())

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
  })

  describe('both directions', () => {
    it('handles right swipe (back) and left swipe (next) with enableNextPost', () => {
      const nextPost = {
        id: 't3_next',
        url: '/r/test/comments/next',
        title: 'Next Post'
      }
      mockGetNextPost.mockReturnValue(nextPost)

      renderHook(() => useSwipeNavigation({enableNextPost: true}))

      // Right swipe - back
      simulateSwipe(50, 100, 200, 100)
      expect(mockBack).toHaveBeenCalledTimes(1)

      // Left swipe - next
      simulateSwipe(200, 100, 50, 100)
      expect(mockPush).toHaveBeenCalledWith(nextPost.url)
    })
  })

  describe('all options together', () => {
    it('works with all custom options', () => {
      renderHook(() =>
        useSwipeNavigation({
          enabled: true,
          threshold: 75,
          maxVerticalMovement: 30,
          enableNextPost: false
        })
      )

      simulateSwipe(100, 100, 200, 120)

      expect(mockBack).toHaveBeenCalledTimes(1)
    })
  })
})
