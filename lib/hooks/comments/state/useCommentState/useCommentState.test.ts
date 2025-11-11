import {renderHook} from '@/test-utils'
import {useCommentState} from './useCommentState'

describe('useCommentState', () => {
  it('should initialize with default state', () => {
    const {result} = renderHook(() => useCommentState())

    expect(result.current.showReplyForm).toBe(false)
    expect(result.current.replyText).toBe('')
    expect(result.current.errorMessage).toBe('')
    expect(result.current.deleteError).toBe('')
    expect(result.current.isDeleted).toBe(false)
    expect(result.current.deleteModalOpened).toBe(false)
  })

  it('should provide setters for reply form state', () => {
    const {result} = renderHook(() => useCommentState())

    expect(typeof result.current.setShowReplyForm).toBe('function')
    expect(typeof result.current.setReplyText).toBe('function')
    expect(typeof result.current.setErrorMessage).toBe('function')
  })

  it('should provide setters for delete state', () => {
    const {result} = renderHook(() => useCommentState())

    expect(typeof result.current.setDeleteError).toBe('function')
    expect(typeof result.current.setIsDeleted).toBe('function')
    expect(typeof result.current.openDeleteModal).toBe('function')
    expect(typeof result.current.closeDeleteModal).toBe('function')
  })

  it('should provide authentication state from Redux', () => {
    const {result} = renderHook(() => useCommentState())

    expect(typeof result.current.isAuthenticated).toBe('boolean')
    // currentUsername can be null when not authenticated
    expect(
      typeof result.current.currentUsername === 'string' ||
        result.current.currentUsername === null
    ).toBe(true)
  })
})
