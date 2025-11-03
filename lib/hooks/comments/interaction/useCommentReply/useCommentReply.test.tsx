import {
  renderHook,
  waitFor,
  server,
  http,
  HttpResponse,
  act
} from '@/test-utils'
import {useCommentReply} from './useCommentReply'

describe('useCommentReply', () => {
  const mockSetReplyText = vi.fn()
  const mockSetErrorMessage = vi.fn()
  const mockSetShowReplyForm = vi.fn()
  const mockReplyButtonRef = {current: document.createElement('button')}

  const defaultProps = {
    commentName: 't1_abc123',
    replyText: 'Test reply',
    setReplyText: mockSetReplyText,
    setErrorMessage: mockSetErrorMessage,
    setShowReplyForm: mockSetShowReplyForm,
    replyButtonRef: mockReplyButtonRef
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should toggle reply form visibility', () => {
    const {result} = renderHook(() => useCommentReply(defaultProps))

    act(() => {
      result.current.toggleReplyForm()
    })

    expect(mockSetShowReplyForm).toHaveBeenCalled()
  })

  it('should clear text when closing form', () => {
    const {result} = renderHook(() => useCommentReply(defaultProps))

    // Simulate closing form (prev = true)
    mockSetShowReplyForm.mockImplementation((fn) => {
      if (typeof fn === 'function') {
        fn(true) // prev state is true (form is open)
      }
    })

    act(() => {
      result.current.toggleReplyForm()
    })

    expect(mockSetReplyText).toHaveBeenCalledWith('')
  })

  it('should not clear text when opening form', () => {
    const {result} = renderHook(() => useCommentReply(defaultProps))

    // Simulate opening form (prev = false)
    mockSetShowReplyForm.mockImplementation((fn) => {
      if (typeof fn === 'function') {
        fn(false) // prev state is false (form is closed)
      }
    })

    act(() => {
      result.current.toggleReplyForm()
    })

    expect(mockSetReplyText).not.toHaveBeenCalled()
  })

  it('should submit comment successfully', async () => {
    const {result} = renderHook(() => useCommentReply(defaultProps))

    await act(async () => {
      await result.current.handleSubmit()
    })

    await waitFor(() => {
      expect(mockSetShowReplyForm).toHaveBeenCalledWith(false)
      expect(mockSetReplyText).toHaveBeenCalledWith('')
      expect(mockSetErrorMessage).toHaveBeenCalledWith('')
    })
  })

  it('should not submit if reply text is empty', async () => {
    const {result} = renderHook(() =>
      useCommentReply({...defaultProps, replyText: ''})
    )

    await act(async () => {
      await result.current.handleSubmit()
    })

    // Should not clear form or show success
    expect(mockSetShowReplyForm).not.toHaveBeenCalledWith(false)
  })

  it('should not submit if reply text is whitespace only', async () => {
    const {result} = renderHook(() =>
      useCommentReply({...defaultProps, replyText: '   '})
    )

    await act(async () => {
      await result.current.handleSubmit()
    })

    // Should not clear form or show success
    expect(mockSetShowReplyForm).not.toHaveBeenCalledWith(false)
  })

  it('should not submit if commentName is empty', async () => {
    const {result} = renderHook(() =>
      useCommentReply({...defaultProps, commentName: ''})
    )

    await act(async () => {
      await result.current.handleSubmit()
    })

    // Should not clear form or show success
    expect(mockSetShowReplyForm).not.toHaveBeenCalledWith(false)
  })

  it('should handle submit error with message', async () => {
    server.use(
      http.post('http://localhost:3000/api/reddit/comment', () => {
        return HttpResponse.json(
          {message: 'Custom error message'},
          {status: 500}
        )
      })
    )

    const {result} = renderHook(() => useCommentReply(defaultProps))

    await act(async () => {
      await result.current.handleSubmit()
    })

    await waitFor(() => {
      expect(mockSetErrorMessage).toHaveBeenCalled()
    })
  })

  it('should handle submit error with error field', async () => {
    server.use(
      http.post('http://localhost:3000/api/reddit/comment', () => {
        return HttpResponse.json({error: 'Error field message'}, {status: 500})
      })
    )

    const {result} = renderHook(() => useCommentReply(defaultProps))

    await act(async () => {
      await result.current.handleSubmit()
    })

    await waitFor(() => {
      expect(mockSetErrorMessage).toHaveBeenCalled()
    })
  })

  it('should handle submit error without message', async () => {
    server.use(
      http.post('http://localhost:3000/api/reddit/comment', () => {
        return HttpResponse.json({}, {status: 500})
      })
    )

    const {result} = renderHook(() => useCommentReply(defaultProps))

    await act(async () => {
      await result.current.handleSubmit()
    })

    await waitFor(() => {
      expect(mockSetErrorMessage).toHaveBeenCalled()
    })
  })

  it('should handle non-data error', async () => {
    server.use(
      http.post('http://localhost:3000/api/reddit/comment', () => {
        throw new Error('Network error')
      })
    )

    const {result} = renderHook(() => useCommentReply(defaultProps))

    await act(async () => {
      await result.current.handleSubmit()
    })

    await waitFor(() => {
      expect(mockSetErrorMessage).toHaveBeenCalled()
    })
  })

  it('should cancel reply and clear form', () => {
    const {result} = renderHook(() => useCommentReply(defaultProps))

    act(() => {
      result.current.handleCancel()
    })

    expect(mockSetShowReplyForm).toHaveBeenCalledWith(false)
    expect(mockSetReplyText).toHaveBeenCalledWith('')
    expect(mockSetErrorMessage).toHaveBeenCalledWith('')
  })

  it('should return focus to reply button after cancel', () => {
    const focusSpy = vi.spyOn(mockReplyButtonRef.current, 'focus')
    const {result} = renderHook(() => useCommentReply(defaultProps))

    act(() => {
      result.current.handleCancel()
    })

    // Wait for setTimeout
    setTimeout(() => {
      expect(focusSpy).toHaveBeenCalled()
    }, 10)
  })

  it('should return isSubmitting state', () => {
    const {result} = renderHook(() => useCommentReply(defaultProps))
    expect(typeof result.current.isSubmitting).toBe('boolean')
  })

  it('should have isSubmitting false initially', () => {
    const {result} = renderHook(() => useCommentReply(defaultProps))
    expect(result.current.isSubmitting).toBe(false)
  })
})
