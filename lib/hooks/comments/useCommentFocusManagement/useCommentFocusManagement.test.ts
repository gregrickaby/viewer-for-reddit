import {renderHook} from '@/test-utils'
import {describe, it, expect, vi} from 'vitest'
import {useCommentFocusManagement} from './useCommentFocusManagement'

describe('useCommentFocusManagement', () => {
  it('should return refs for focus management', () => {
    const {result} = renderHook(() =>
      useCommentFocusManagement({showReplyForm: false})
    )

    expect(result.current.textareaRef).toBeDefined()
    expect(result.current.replyButtonRef).toBeDefined()
    expect(result.current.deleteButtonRef).toBeDefined()
  })

  it('should initialize refs with null', () => {
    const {result} = renderHook(() =>
      useCommentFocusManagement({showReplyForm: false})
    )

    expect(result.current.textareaRef.current).toBeNull()
    expect(result.current.replyButtonRef.current).toBeNull()
    expect(result.current.deleteButtonRef.current).toBeNull()
  })

  it('should focus textarea when showReplyForm becomes true', () => {
    const mockTextarea = document.createElement('textarea')
    const focusSpy = vi.spyOn(mockTextarea, 'focus')

    let showReplyForm = false
    const {result, rerender} = renderHook(() =>
      useCommentFocusManagement({showReplyForm})
    )

    // Set the ref manually
    result.current.textareaRef.current = mockTextarea

    // Trigger showReplyForm change
    showReplyForm = true
    rerender()

    expect(focusSpy).toHaveBeenCalled()
  })

  it('should not focus when textarea ref is null', () => {
    let showReplyForm = false
    const {rerender} = renderHook(() =>
      useCommentFocusManagement({showReplyForm})
    )

    // No error should be thrown when ref is null
    showReplyForm = true
    expect(() => rerender()).not.toThrow()
  })

  it('should maintain refs across rerenders', () => {
    const {result, rerender} = renderHook(() =>
      useCommentFocusManagement({showReplyForm: false})
    )

    const initialTextareaRef = result.current.textareaRef
    const initialReplyButtonRef = result.current.replyButtonRef
    const initialDeleteButtonRef = result.current.deleteButtonRef

    rerender()

    expect(result.current.textareaRef).toBe(initialTextareaRef)
    expect(result.current.replyButtonRef).toBe(initialReplyButtonRef)
    expect(result.current.deleteButtonRef).toBe(initialDeleteButtonRef)
  })
})
