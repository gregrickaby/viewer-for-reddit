import {act, renderHook} from '@/test-utils'
import {describe, expect, it, vi} from 'vitest'
import {useCommentDOMTracking} from './useCommentDOMTracking'

describe('useCommentDOMTracking', () => {
  it('should initialize with empty elements when disabled', () => {
    const {result} = renderHook(() =>
      useCommentDOMTracking({
        enabled: false
      })
    )

    expect(result.current.elements).toEqual([])
  })

  it('should query comment elements when enabled', () => {
    const element = document.createElement('div')
    element.dataset.commentId = 'comment-1'
    document.body.appendChild(element)

    const {result} = renderHook(() =>
      useCommentDOMTracking({
        enabled: true
      })
    )

    expect(result.current.elements).toHaveLength(1)
    expect(result.current.elements[0]).toBe(element)

    // Cleanup
    element.remove()
  })

  it('should update elements when updateElements is called', () => {
    const element1 = document.createElement('div')
    element1.dataset.commentId = 'comment-1'
    document.body.appendChild(element1)

    const {result} = renderHook(() =>
      useCommentDOMTracking({
        enabled: true
      })
    )

    expect(result.current.elements).toHaveLength(1)

    // Add another element
    const element2 = document.createElement('div')
    element2.dataset.commentId = 'comment-2'
    document.body.appendChild(element2)

    act(() => {
      result.current.updateElements()
    })

    expect(result.current.elements).toHaveLength(2)

    // Cleanup
    element1.remove()
    element2.remove()
  })

  it('should observe DOM changes with MutationObserver', async () => {
    const {result} = renderHook(() =>
      useCommentDOMTracking({
        enabled: true
      })
    )

    expect(result.current.elements).toHaveLength(0)

    // Add element to DOM
    const element = document.createElement('div')
    element.dataset.commentId = 'comment-1'

    act(() => {
      document.body.appendChild(element)
    })

    // MutationObserver triggers asynchronously
    await vi.waitFor(() => {
      expect(result.current.elements).toHaveLength(1)
    })

    // Cleanup
    element.remove()
  })

  it('should disconnect observer on unmount', () => {
    const disconnectSpy = vi.spyOn(MutationObserver.prototype, 'disconnect')

    const {unmount} = renderHook(() =>
      useCommentDOMTracking({
        enabled: true
      })
    )

    unmount()

    expect(disconnectSpy).toHaveBeenCalled()

    disconnectSpy.mockRestore()
  })

  it('should not observe when disabled', () => {
    const observeSpy = vi.spyOn(MutationObserver.prototype, 'observe')

    renderHook(() =>
      useCommentDOMTracking({
        enabled: false
      })
    )

    expect(observeSpy).not.toHaveBeenCalled()

    observeSpy.mockRestore()
  })

  it('should clear elements when disabled via rerender', () => {
    const element = document.createElement('div')
    element.dataset.commentId = 'comment-1'
    document.body.appendChild(element)

    let enabled = true

    const {result, rerender} = renderHook(() =>
      useCommentDOMTracking({
        enabled
      })
    )

    expect(result.current.elements).toHaveLength(1)

    // Disable
    enabled = false
    rerender()

    act(() => {
      result.current.updateElements()
    })

    expect(result.current.elements).toHaveLength(0)

    // Cleanup
    element.remove()
  })

  it('should handle multiple elements with same attribute', () => {
    const elements = Array.from({length: 5}, (_, i) => {
      const el = document.createElement('div')
      el.dataset.commentId = `comment-${i}`
      document.body.appendChild(el)
      return el
    })

    const {result} = renderHook(() =>
      useCommentDOMTracking({
        enabled: true
      })
    )

    expect(result.current.elements).toHaveLength(5)

    // Cleanup
    for (const el of elements) el.remove()
  })

  it('should only query elements with data-comment-id attribute', () => {
    const withAttr = document.createElement('div')
    withAttr.dataset.commentId = 'comment-1'
    document.body.appendChild(withAttr)

    const withoutAttr = document.createElement('div')
    document.body.appendChild(withoutAttr)

    const {result} = renderHook(() =>
      useCommentDOMTracking({
        enabled: true
      })
    )

    expect(result.current.elements).toHaveLength(1)
    expect(result.current.elements[0]).toBe(withAttr)

    // Cleanup
    withAttr.remove()
    withoutAttr.remove()
  })

  it('should update elements when enabled changes from false to true', () => {
    const element = document.createElement('div')
    element.dataset.commentId = 'comment-1'
    document.body.appendChild(element)

    let enabled = false

    const {result, rerender} = renderHook(() =>
      useCommentDOMTracking({
        enabled
      })
    )

    expect(result.current.elements).toHaveLength(0)

    // Enable
    enabled = true
    rerender()

    expect(result.current.elements).toHaveLength(1)

    // Cleanup
    element.remove()
  })
})
