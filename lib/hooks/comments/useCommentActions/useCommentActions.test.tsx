import {renderHook, waitFor, server, http, HttpResponse} from '@/test-utils'
import {useCommentActions} from './useCommentActions'

describe('useCommentActions', () => {
  const mockSetReplyText = vi.fn()
  const mockSetErrorMessage = vi.fn()
  const mockSetShowReplyForm = vi.fn()
  const mockSetDeleteError = vi.fn()
  const mockSetIsDeleted = vi.fn()
  const mockCloseDeleteModal = vi.fn()
  const mockReplyButtonRef = {current: document.createElement('button')}
  const mockDeleteButtonRef = {current: document.createElement('button')}

  const defaultProps = {
    commentName: 't1_abc123',
    replyText: 'Test reply',
    setReplyText: mockSetReplyText,
    setErrorMessage: mockSetErrorMessage,
    setShowReplyForm: mockSetShowReplyForm,
    setDeleteError: mockSetDeleteError,
    setIsDeleted: mockSetIsDeleted,
    closeDeleteModal: mockCloseDeleteModal,
    replyButtonRef: mockReplyButtonRef,
    deleteButtonRef: mockDeleteButtonRef
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should toggle reply form', () => {
    const {result} = renderHook(() => useCommentActions(defaultProps))
    result.current.toggleReplyForm()
    expect(mockSetShowReplyForm).toHaveBeenCalled()
  })

  it('should submit comment successfully', async () => {
    const {result} = renderHook(() => useCommentActions(defaultProps))
    await result.current.handleSubmit()

    await waitFor(() => {
      expect(mockSetShowReplyForm).toHaveBeenCalledWith(false)
      expect(mockSetReplyText).toHaveBeenCalledWith('')
    })
  })

  it('should handle submit error', async () => {
    server.use(
      http.post('http://localhost:3000/api/reddit/me/comment', () => {
        return HttpResponse.json({message: 'Failed to submit'}, {status: 500})
      })
    )

    const {result} = renderHook(() => useCommentActions(defaultProps))
    await result.current.handleSubmit()

    await waitFor(() => {
      expect(mockSetErrorMessage).toHaveBeenCalled()
    })
  })

  it('should cancel reply form', () => {
    const {result} = renderHook(() => useCommentActions(defaultProps))
    result.current.handleCancel()

    expect(mockSetShowReplyForm).toHaveBeenCalledWith(false)
    expect(mockSetReplyText).toHaveBeenCalledWith('')
    expect(mockSetErrorMessage).toHaveBeenCalledWith('')
  })

  it('should delete comment successfully', async () => {
    const {result} = renderHook(() => useCommentActions(defaultProps))
    await result.current.handleDeleteConfirm()

    await waitFor(() => {
      expect(mockSetIsDeleted).toHaveBeenCalledWith(true)
      expect(mockCloseDeleteModal).toHaveBeenCalled()
    })
  })

  it('should handle delete error', async () => {
    server.use(
      http.post('http://localhost:3000/api/reddit/me/comment/delete', () => {
        return HttpResponse.json({message: 'Failed to delete'}, {status: 500})
      })
    )

    const {result} = renderHook(() => useCommentActions(defaultProps))
    await result.current.handleDeleteConfirm()

    await waitFor(() => {
      expect(mockSetDeleteError).toHaveBeenCalled()
      expect(mockCloseDeleteModal).toHaveBeenCalled()
    })
  })

  it('should cancel delete modal', () => {
    const {result} = renderHook(() => useCommentActions(defaultProps))
    result.current.handleDeleteCancel()

    expect(mockCloseDeleteModal).toHaveBeenCalled()
  })

  it('should return isSubmitting state', () => {
    const {result} = renderHook(() => useCommentActions(defaultProps))
    expect(typeof result.current.isSubmitting).toBe('boolean')
  })

  it('should return isDeleting state', () => {
    const {result} = renderHook(() => useCommentActions(defaultProps))
    expect(typeof result.current.isDeleting).toBe('boolean')
  })
})
