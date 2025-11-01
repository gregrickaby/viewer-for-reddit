import {act, renderHook} from '@/test-utils'
import {describe, expect, it} from 'vitest'
import {useCommentFocus} from './useCommentFocus'

describe('useCommentFocus', () => {
  it('should initialize with no focus and no announcement', () => {
    const {result} = renderHook(() =>
      useCommentFocus({
        elements: [],
        announceNavigation: true
      })
    )

    expect(result.current.currentFocusIndex).toBe(-1)
    expect(result.current.announcementText).toBe('')
  })

  it('should focus element at valid index', () => {
    const element = document.createElement('div')
    element.tabIndex = -1
    element.dataset.commentDepth = '0'
    document.body.appendChild(element)

    const {result} = renderHook(() =>
      useCommentFocus({
        elements: [element],
        announceNavigation: true
      })
    )

    act(() => {
      result.current.handleCommentFocus(0)
    })

    expect(result.current.currentFocusIndex).toBe(0)
    expect(element).toHaveFocus()

    // Cleanup
    element.remove()
  })

  it('should not focus when index is out of bounds', () => {
    const element = document.createElement('div')
    element.tabIndex = -1
    document.body.appendChild(element)

    const {result} = renderHook(() =>
      useCommentFocus({
        elements: [element],
        announceNavigation: true
      })
    )

    act(() => {
      // Try negative index
      result.current.handleCommentFocus(-1)
    })
    expect(result.current.currentFocusIndex).toBe(-1)

    act(() => {
      // Try index beyond length
      result.current.handleCommentFocus(10)
    })
    expect(result.current.currentFocusIndex).toBe(-1)

    // Cleanup
    element.remove()
  })

  it('should generate announcement with depth when announceNavigation is true', () => {
    const element = document.createElement('div')
    element.tabIndex = -1
    element.dataset.commentDepth = '2'
    document.body.appendChild(element)

    const {result} = renderHook(() =>
      useCommentFocus({
        elements: [element],
        announceNavigation: true
      })
    )

    act(() => {
      result.current.handleCommentFocus(0)
    })

    expect(result.current.announcementText).toBe('Comment 1 of 1, depth 2')

    // Cleanup
    element.remove()
  })

  it('should not generate announcement when announceNavigation is false', () => {
    const element = document.createElement('div')
    element.tabIndex = -1
    element.dataset.commentDepth = '1'
    document.body.appendChild(element)

    const {result} = renderHook(() =>
      useCommentFocus({
        elements: [element],
        announceNavigation: false
      })
    )

    act(() => {
      result.current.handleCommentFocus(0)
    })

    expect(result.current.currentFocusIndex).toBe(0)
    expect(result.current.announcementText).toBe('')

    // Cleanup
    element.remove()
  })

  it('should handle element without depth attribute', () => {
    const element = document.createElement('div')
    element.tabIndex = -1
    // No commentDepth set
    document.body.appendChild(element)

    const {result} = renderHook(() =>
      useCommentFocus({
        elements: [element],
        announceNavigation: true
      })
    )

    act(() => {
      result.current.handleCommentFocus(0)
    })

    expect(result.current.announcementText).toBe('Comment 1 of 1, depth 0')

    // Cleanup
    element.remove()
  })

  it('should clear announcement text', () => {
    const element = document.createElement('div')
    element.tabIndex = -1
    element.dataset.commentDepth = '0'
    document.body.appendChild(element)

    const {result} = renderHook(() =>
      useCommentFocus({
        elements: [element],
        announceNavigation: true
      })
    )

    act(() => {
      // Set announcement
      result.current.handleCommentFocus(0)
    })
    expect(result.current.announcementText).toBe('Comment 1 of 1, depth 0')

    act(() => {
      // Clear it
      result.current.clearAnnouncement()
    })
    expect(result.current.announcementText).toBe('')

    // Cleanup
    element.remove()
  })

  it('should update announcement for multiple elements', () => {
    const elements = Array.from({length: 3}, (_, i) => {
      const el = document.createElement('div')
      el.tabIndex = -1
      el.dataset.commentDepth = String(i)
      document.body.appendChild(el)
      return el
    })

    const {result} = renderHook(() =>
      useCommentFocus({
        elements,
        announceNavigation: true
      })
    )

    act(() => {
      // Focus first
      result.current.handleCommentFocus(0)
    })
    expect(result.current.announcementText).toBe('Comment 1 of 3, depth 0')

    act(() => {
      // Focus second
      result.current.handleCommentFocus(1)
    })
    expect(result.current.announcementText).toBe('Comment 2 of 3, depth 1')

    act(() => {
      // Focus third
      result.current.handleCommentFocus(2)
    })
    expect(result.current.announcementText).toBe('Comment 3 of 3, depth 2')

    // Cleanup
    for (const el of elements) el.remove()
  })

  it('should update focus when elements prop changes', () => {
    const element1 = document.createElement('div')
    element1.tabIndex = -1
    element1.dataset.commentDepth = '0'
    document.body.appendChild(element1)

    const element2 = document.createElement('div')
    element2.tabIndex = -1
    element2.dataset.commentDepth = '1'
    document.body.appendChild(element2)

    let elements = [element1]

    const {result, rerender} = renderHook(() =>
      useCommentFocus({
        elements,
        announceNavigation: true
      })
    )

    act(() => {
      // Focus first element
      result.current.handleCommentFocus(0)
    })
    expect(result.current.currentFocusIndex).toBe(0)
    expect(result.current.announcementText).toBe('Comment 1 of 1, depth 0')

    // Change elements
    elements = [element1, element2]
    rerender()

    act(() => {
      // Focus second element (now valid)
      result.current.handleCommentFocus(1)
    })
    expect(result.current.currentFocusIndex).toBe(1)
    expect(result.current.announcementText).toBe('Comment 2 of 2, depth 1')

    // Cleanup
    element1.remove()
    element2.remove()
  })

  it('should handle announceNavigation toggle', () => {
    const element = document.createElement('div')
    element.tabIndex = -1
    element.dataset.commentDepth = '0'
    document.body.appendChild(element)

    let announceNavigation = true

    const {result, rerender} = renderHook(() =>
      useCommentFocus({
        elements: [element],
        announceNavigation
      })
    )

    act(() => {
      // Announce enabled
      result.current.handleCommentFocus(0)
    })
    expect(result.current.announcementText).toBe('Comment 1 of 1, depth 0')

    act(() => {
      // Clear and disable announcements
      result.current.clearAnnouncement()
    })
    announceNavigation = false
    rerender()

    act(() => {
      // Focus again (should not announce)
      result.current.handleCommentFocus(0)
    })
    expect(result.current.announcementText).toBe('')

    // Cleanup
    element.remove()
  })
})
