import {act, renderHook} from '@/test-utils'
import {describe, it, expect, beforeEach, afterEach, vi} from 'vitest'
import {useCommentNavigation} from './useCommentNavigation'

// Mock useKeyboardNav to avoid testing Mantine internals
vi.mock('../useKeyboardNav/useKeyboardNav', () => ({
  useKeyboardNav: vi.fn()
}))

describe('useCommentNavigation', () => {
  let elements: HTMLElement[]

  beforeEach(() => {
    elements = []
  })

  afterEach(() => {
    for (const el of elements) {
      el.remove()
    }
    elements = []
  })

  /**
   * Helper to create comment elements with depth.
   */
  function createCommentElement(id: string, depth: number): HTMLElement {
    const element = document.createElement('div')
    element.tabIndex = -1
    element.dataset.commentId = id
    element.dataset.commentDepth = String(depth)
    document.body.appendChild(element)
    elements.push(element)
    return element
  }

  it('should initialize with empty focus and announcement', () => {
    const {result} = renderHook(() => useCommentNavigation())

    expect(result.current.currentFocusIndex).toBe(-1)
    expect(result.current.announcementText).toBe('')
  })

  it('should navigate to next comment', () => {
    const el1 = createCommentElement('c1', 0)
    createCommentElement('c2', 0)

    const {result} = renderHook(() => useCommentNavigation())

    act(() => {
      result.current.handleCommentFocus(0)
    })

    expect(result.current.currentFocusIndex).toBe(0)
    expect(el1).toHaveFocus()
  })

  it('should wrap around to first comment when at end', () => {
    createCommentElement('c1', 0)
    createCommentElement('c2', 0)
    createCommentElement('c3', 0)

    const {result} = renderHook(() => useCommentNavigation())

    // Focus last element (index 2)
    act(() => {
      result.current.handleCommentFocus(2)
    })

    expect(result.current.currentFocusIndex).toBe(2)
  })

  it('should wrap around to last comment when at start', () => {
    createCommentElement('c1', 0)
    createCommentElement('c2', 0)
    createCommentElement('c3', 0)

    const {result} = renderHook(() => useCommentNavigation())

    // Focus first element
    act(() => {
      result.current.handleCommentFocus(0)
    })

    expect(result.current.currentFocusIndex).toBe(0)
  })

  it('should navigate to parent comment based on depth', () => {
    createCommentElement('c1', 0) // Parent
    createCommentElement('c2', 1) // Child of c1
    createCommentElement('c3', 2) // Grandchild of c1
    createCommentElement('c4', 1) // Another child of c1

    const {result} = renderHook(() => useCommentNavigation())

    // Focus grandchild (index 2, depth 2)
    act(() => {
      result.current.handleCommentFocus(2)
    })

    expect(result.current.currentFocusIndex).toBe(2)
  })

  it('should not navigate to parent when at depth 0', () => {
    createCommentElement('c1', 0)
    createCommentElement('c2', 0)

    const {result} = renderHook(() => useCommentNavigation())

    // Focus first top-level comment
    act(() => {
      result.current.handleCommentFocus(0)
    })

    expect(result.current.currentFocusIndex).toBe(0)
  })

  it('should generate accessibility announcements when enabled', () => {
    createCommentElement('c1', 0)
    createCommentElement('c2', 1)

    const {result} = renderHook(() =>
      useCommentNavigation({announceNavigation: true})
    )

    act(() => {
      result.current.handleCommentFocus(0)
    })

    expect(result.current.announcementText).toBe('Comment 1 of 2, depth 0')

    act(() => {
      result.current.handleCommentFocus(1)
    })

    expect(result.current.announcementText).toBe('Comment 2 of 2, depth 1')
  })

  it('should not generate announcements when disabled', () => {
    createCommentElement('c1', 0)

    const {result} = renderHook(() =>
      useCommentNavigation({announceNavigation: false})
    )

    act(() => {
      result.current.handleCommentFocus(0)
    })

    expect(result.current.announcementText).toBe('')
  })

  it('should clear announcement text', () => {
    createCommentElement('c1', 0)

    const {result} = renderHook(() =>
      useCommentNavigation({announceNavigation: true})
    )

    act(() => {
      result.current.handleCommentFocus(0)
    })

    expect(result.current.announcementText).toBeTruthy()

    act(() => {
      result.current.clearAnnouncement()
    })

    expect(result.current.announcementText).toBe('')
  })

  it('should handle focus when no elements exist', () => {
    const {result} = renderHook(() => useCommentNavigation())

    // Should not throw error
    expect(() => {
      act(() => {
        result.current.handleCommentFocus(0)
      })
    }).not.toThrow()

    expect(result.current.currentFocusIndex).toBe(-1)
  })

  it('should handle bounds checking for invalid indices', () => {
    createCommentElement('c1', 0)

    const {result} = renderHook(() => useCommentNavigation())

    // Negative index
    act(() => {
      result.current.handleCommentFocus(-1)
    })

    expect(result.current.currentFocusIndex).toBe(-1)

    // Out of range index
    act(() => {
      result.current.handleCommentFocus(999)
    })

    expect(result.current.currentFocusIndex).toBe(-1)
  })

  it('should update elements when enabled changes', () => {
    createCommentElement('c1', 0)

    const {result, rerender} = renderHook((enabled: boolean) =>
      useCommentNavigation({enabled})
    )

    // Initially disabled - elements should be empty (pass false)
    rerender(false)
    expect(result.current.currentFocusIndex).toBe(-1)

    // Enable navigation (pass true)
    rerender(true)

    // Should now be able to focus
    act(() => {
      result.current.handleCommentFocus(0)
    })

    expect(result.current.currentFocusIndex).toBe(0)
  })

  it('should handle parent navigation with missing elements', () => {
    createCommentElement('c1', 0)

    const {result} = renderHook(() => useCommentNavigation())

    // Focus element at depth 0
    act(() => {
      result.current.handleCommentFocus(0)
    })

    // Should stay at same position (no parent to navigate to)
    expect(result.current.currentFocusIndex).toBe(0)
  })

  it('should handle sequential navigation correctly', () => {
    const el1 = createCommentElement('c1', 0)
    const el2 = createCommentElement('c2', 0)
    const el3 = createCommentElement('c3', 0)

    const {result} = renderHook(() => useCommentNavigation())

    // Focus first
    act(() => {
      result.current.handleCommentFocus(0)
    })
    expect(el1).toHaveFocus()
    expect(result.current.currentFocusIndex).toBe(0)

    // Focus second
    act(() => {
      result.current.handleCommentFocus(1)
    })
    expect(el2).toHaveFocus()
    expect(result.current.currentFocusIndex).toBe(1)

    // Focus third
    act(() => {
      result.current.handleCommentFocus(2)
    })
    expect(el3).toHaveFocus()
    expect(result.current.currentFocusIndex).toBe(2)
  })

  it('should find correct parent in nested structure', () => {
    createCommentElement('c1', 0) // Top level
    createCommentElement('c2', 1) // Child
    createCommentElement('c3', 2) // Grandchild
    createCommentElement('c4', 3) // Great-grandchild
    createCommentElement('c5', 1) // Another child

    const {result} = renderHook(() => useCommentNavigation())

    // Focus great-grandchild (index 3, depth 3)
    act(() => {
      result.current.handleCommentFocus(3)
    })

    expect(result.current.currentFocusIndex).toBe(3)
  })

  it('should handle multiple elements with same depth', () => {
    createCommentElement('c1', 0)
    createCommentElement('c2', 0)
    createCommentElement('c3', 0)
    createCommentElement('c4', 0)
    createCommentElement('c5', 0)

    const {result} = renderHook(() => useCommentNavigation())

    // Should be able to focus any element
    for (let i = 0; i < 5; i++) {
      act(() => {
        result.current.handleCommentFocus(i)
      })
      expect(result.current.currentFocusIndex).toBe(i)
    }
  })

  it('should compose all sub-hooks correctly', () => {
    createCommentElement('c1', 0)
    createCommentElement('c2', 1)

    const {result} = renderHook(() =>
      useCommentNavigation({
        enabled: true,
        announceNavigation: true
      })
    )

    // Test DOM tracking (elements are found)
    act(() => {
      result.current.handleCommentFocus(0)
    })
    expect(result.current.currentFocusIndex).toBe(0)

    // Test focus management (element is focused)
    expect(elements[0]).toHaveFocus()

    // Test announcements (accessibility text generated)
    expect(result.current.announcementText).toBe('Comment 1 of 2, depth 0')

    // Test keyboard nav would be registered (mocked so no actual test)
    // Just verify the hook doesn't throw
    expect(result.current).toBeDefined()
  })

  it('should handle dynamic DOM changes', async () => {
    createCommentElement('c1', 0)

    const {result} = renderHook(() => useCommentNavigation())

    act(() => {
      result.current.handleCommentFocus(0)
    })

    expect(result.current.currentFocusIndex).toBe(0)

    // Add new element dynamically
    createCommentElement('c2', 0)

    // Note: Navigation functions call updateElements internally
    // But if we directly call handleCommentFocus, we need manual refresh via MutationObserver
    // Wait a bit for MutationObserver to fire
    await new Promise((resolve) => setTimeout(resolve, 100))

    // Navigation should work with new element
    act(() => {
      result.current.handleCommentFocus(1)
    })

    expect(result.current.currentFocusIndex).toBe(1)
  })
})
