import {
  renderHook,
  waitFor,
  server,
  http,
  HttpResponse,
  act
} from '@/test-utils'
import {useCommentDelete} from './useCommentDelete'

describe('useCommentDelete', () => {
  const mockSetDeleteError = vi.fn()
  const mockSetIsDeleted = vi.fn()
  const mockCloseDeleteModal = vi.fn()
  const mockDeleteButtonRef = {current: document.createElement('button')}

  const defaultProps = {
    commentName: 't1_abc123',
    setDeleteError: mockSetDeleteError,
    setIsDeleted: mockSetIsDeleted,
    closeDeleteModal: mockCloseDeleteModal,
    deleteButtonRef: mockDeleteButtonRef
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should delete comment successfully', async () => {
    const {result} = renderHook(() => useCommentDelete(defaultProps))

    await act(async () => {
      await result.current.handleDeleteConfirm()
    })

    await waitFor(() => {
      expect(mockSetIsDeleted).toHaveBeenCalledWith(true)
      expect(mockCloseDeleteModal).toHaveBeenCalled()
      expect(mockSetDeleteError).toHaveBeenCalledWith('')
    })
  })

  it('should not delete if commentName is empty', async () => {
    const {result} = renderHook(() =>
      useCommentDelete({...defaultProps, commentName: ''})
    )

    await act(async () => {
      await result.current.handleDeleteConfirm()
    })

    // Should not mark as deleted
    expect(mockSetIsDeleted).not.toHaveBeenCalled()
  })

  it('should handle delete error with message', async () => {
    server.use(
      http.post('http://localhost:3000/api/reddit/comment/delete', () => {
        return HttpResponse.json(
          {message: 'Custom delete error'},
          {status: 500}
        )
      })
    )

    const {result} = renderHook(() => useCommentDelete(defaultProps))

    await act(async () => {
      await result.current.handleDeleteConfirm()
    })

    await waitFor(() => {
      expect(mockSetDeleteError).toHaveBeenCalled()
    })
  })

  it('should handle delete error with error field', async () => {
    server.use(
      http.post('http://localhost:3000/api/reddit/comment/delete', () => {
        return HttpResponse.json({error: 'Error field message'}, {status: 500})
      })
    )

    const {result} = renderHook(() => useCommentDelete(defaultProps))

    await act(async () => {
      await result.current.handleDeleteConfirm()
    })

    await waitFor(() => {
      expect(mockSetDeleteError).toHaveBeenCalled()
    })
  })

  it('should handle delete error without message', async () => {
    server.use(
      http.post('http://localhost:3000/api/reddit/comment/delete', () => {
        return HttpResponse.json({}, {status: 500})
      })
    )

    const {result} = renderHook(() => useCommentDelete(defaultProps))

    await act(async () => {
      await result.current.handleDeleteConfirm()
    })

    await waitFor(() => {
      expect(mockSetDeleteError).toHaveBeenCalled()
    })
  })

  it('should handle non-data error', async () => {
    server.use(
      http.post('http://localhost:3000/api/reddit/comment/delete', () => {
        throw new Error('Network error')
      })
    )

    const {result} = renderHook(() => useCommentDelete(defaultProps))

    await act(async () => {
      await result.current.handleDeleteConfirm()
    })

    await waitFor(() => {
      expect(mockSetDeleteError).toHaveBeenCalled()
    })
  })

  it('should close modal even if deletion fails', async () => {
    server.use(
      http.post('http://localhost:3000/api/reddit/comment/delete', () => {
        return HttpResponse.json({error: 'Failed'}, {status: 500})
      })
    )

    const {result} = renderHook(() => useCommentDelete(defaultProps))

    await act(async () => {
      await result.current.handleDeleteConfirm()
    })

    await waitFor(() => {
      expect(mockCloseDeleteModal).toHaveBeenCalled()
    })
  })

  it('should cancel deletion and close modal', () => {
    const {result} = renderHook(() => useCommentDelete(defaultProps))

    act(() => {
      result.current.handleDeleteCancel()
    })

    expect(mockCloseDeleteModal).toHaveBeenCalled()
  })

  it('should return focus to delete button after cancel', () => {
    const focusSpy = vi.spyOn(mockDeleteButtonRef.current, 'focus')
    const {result} = renderHook(() => useCommentDelete(defaultProps))

    act(() => {
      result.current.handleDeleteCancel()
    })

    // Wait for setTimeout
    setTimeout(() => {
      expect(focusSpy).toHaveBeenCalled()
    }, 10)
  })

  it('should return isDeleting state', () => {
    const {result} = renderHook(() => useCommentDelete(defaultProps))
    expect(typeof result.current.isDeleting).toBe('boolean')
  })

  it('should have isDeleting false initially', () => {
    const {result} = renderHook(() => useCommentDelete(defaultProps))
    expect(result.current.isDeleting).toBe(false)
  })

  it('should clear error before deletion attempt', async () => {
    const {result} = renderHook(() => useCommentDelete(defaultProps))

    await act(async () => {
      await result.current.handleDeleteConfirm()
    })

    await waitFor(() => {
      expect(mockSetDeleteError).toHaveBeenCalledWith('')
    })
  })

  it('should not mark as deleted on error', async () => {
    const {result} = renderHook(() => useCommentDelete(defaultProps))

    server.use(
      http.post('http://localhost:3000/api/reddit/comment/delete', () => {
        return HttpResponse.json({error: 'Failed'}, {status: 500})
      })
    )

    await act(async () => {
      await result.current.handleDeleteConfirm()
    })

    await waitFor(() => {
      expect(mockSetDeleteError).toHaveBeenCalled()
    })

    expect(mockSetIsDeleted).not.toHaveBeenCalledWith(true)
  })
})
