import {useSave} from '@/lib/hooks/util/useSave'
import {renderHook, waitFor} from '@/test-utils'
import {notifications} from '@mantine/notifications'
import {act} from 'react'
import {beforeEach, describe, expect, it, vi} from 'vitest'

// Mock the save mutation
const mockSave = vi.fn()
vi.mock('@/lib/store/services/saveApi', async (importOriginal) => {
  const actual: Record<string, unknown> =
    await importOriginal<Record<string, unknown>>()
  return {
    ...actual,
    useSaveMutation: () => [mockSave, {isLoading: false}]
  }
})

vi.mock('@mantine/notifications', () => ({
  notifications: {
    show: vi.fn()
  }
}))

vi.mock('@/lib/utils/logging/clientLogger', () => ({
  logClientError: vi.fn()
}))

describe('useSave', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset mock to default implementation
    mockSave.mockReturnValue({unwrap: vi.fn().mockResolvedValue({})})
  })

  it('should initialize with correct default state', () => {
    const {result} = renderHook(() =>
      useSave({id: 't3_test', initialSaved: false})
    )

    expect(result.current.isSaved).toBe(false)
    expect(result.current.isSaving).toBe(false)
    expect(typeof result.current.handleSave).toBe('function')
  })

  it('should initialize with saved state when provided', () => {
    const {result} = renderHook(() =>
      useSave({id: 't3_test', initialSaved: true})
    )

    expect(result.current.isSaved).toBe(true)
  })

  it('should handle saving a post successfully', async () => {
    mockSave.mockReturnValue({
      unwrap: vi
        .fn()
        .mockResolvedValue({success: true, id: 't3_test', saved: true})
    })

    const {result} = renderHook(() =>
      useSave({id: 't3_test', initialSaved: false})
    )

    // Initially not saved
    expect(result.current.isSaved).toBe(false)

    // Trigger save
    await act(async () => {
      await result.current.handleSave()
    })

    // Should be saved
    await waitFor(() => {
      expect(result.current.isSaved).toBe(true)
    })

    // Should call mutation with correct args
    expect(mockSave).toHaveBeenCalledWith({id: 't3_test', save: true})

    // Should show success notification
    expect(notifications.show).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Post saved',
        message: 'You can view this post in your saved posts feed.',
        color: 'green',
        autoClose: 3000
      })
    )
  })

  it('should handle unsaving a post successfully', async () => {
    mockSave.mockReturnValue({
      unwrap: vi
        .fn()
        .mockResolvedValue({success: true, id: 't3_test', saved: false})
    })

    const {result} = renderHook(() =>
      useSave({id: 't3_test', initialSaved: true})
    )

    // Initially saved
    expect(result.current.isSaved).toBe(true)

    // Trigger unsave
    await act(async () => {
      await result.current.handleSave()
    })

    // Should be unsaved
    await waitFor(() => {
      expect(result.current.isSaved).toBe(false)
    })

    // Should call mutation with correct args
    expect(mockSave).toHaveBeenCalledWith({id: 't3_test', save: false})

    // Should show success notification
    expect(notifications.show).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Post unsaved',
        message: 'Post removed from your saved posts.',
        color: 'green',
        autoClose: 3000
      })
    )
  })

  it('should rollback on mutation error', async () => {
    mockSave.mockRejectedValue(new Error('Network error'))

    const {result} = renderHook(() =>
      useSave({id: 't3_test', initialSaved: false})
    )

    // Initially not saved
    expect(result.current.isSaved).toBe(false)

    // Trigger save (will fail)
    await act(async () => {
      await result.current.handleSave()
    })

    // Should rollback to original state
    await waitFor(() => {
      expect(result.current.isSaved).toBe(false)
    })

    // Should show error notification
    expect(notifications.show).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Save failed',
        message: 'Unable to save post. Please try again.',
        color: 'red',
        autoClose: 3000
      })
    )
  })

  it('should show authentication error notification for 401 errors', async () => {
    mockSave.mockReturnValue({
      unwrap: vi.fn().mockRejectedValue({status: 401, message: 'Unauthorized'})
    })

    const {result} = renderHook(() =>
      useSave({id: 't3_test', initialSaved: false})
    )

    // Trigger save (will fail with auth error)
    await act(async () => {
      await result.current.handleSave()
    })

    // Should rollback
    await waitFor(() => {
      expect(result.current.isSaved).toBe(false)
    })

    // Should show auth-specific notification
    expect(notifications.show).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Sign in required',
        message: 'Please sign in to save posts.',
        color: 'blue',
        autoClose: 3000
      })
    )
  })

  it('should toggle state optimistically on multiple clicks', async () => {
    // First call - save
    mockSave.mockReturnValueOnce({
      unwrap: vi
        .fn()
        .mockResolvedValue({success: true, id: 't3_test', saved: true})
    })

    const {result} = renderHook(() =>
      useSave({id: 't3_test', initialSaved: false})
    )

    // First click - save
    await act(async () => {
      await result.current.handleSave()
    })

    await waitFor(() => {
      expect(result.current.isSaved).toBe(true)
    })

    // Mock unsave response
    mockSave.mockReturnValueOnce({
      unwrap: vi
        .fn()
        .mockResolvedValue({success: true, id: 't3_test', saved: false})
    })

    // Second click - unsave
    await act(async () => {
      await result.current.handleSave()
    })

    await waitFor(() => {
      expect(result.current.isSaved).toBe(false)
    })

    // Should have been called twice
    expect(mockSave).toHaveBeenCalledTimes(2)
    expect(mockSave).toHaveBeenNthCalledWith(1, {id: 't3_test', save: true})
    expect(mockSave).toHaveBeenNthCalledWith(2, {id: 't3_test', save: false})
  })

  it('should handle undefined initialSaved', () => {
    const {result} = renderHook(() => useSave({id: 't3_test'}))

    expect(result.current.isSaved).toBe(false)
  })

  it('should use unwrap to properly handle mutation errors', async () => {
    const unwrapMock = vi.fn().mockRejectedValue(new Error('Unwrap error'))
    mockSave.mockReturnValue({unwrap: unwrapMock})

    const {result} = renderHook(() =>
      useSave({id: 't3_test', initialSaved: false})
    )

    await act(async () => {
      await result.current.handleSave()
    })

    // Should call unwrap (which throws)
    expect(unwrapMock).toHaveBeenCalled()

    // Should rollback and show error
    await waitFor(() => {
      expect(result.current.isSaved).toBe(false)
    })
    expect(notifications.show).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Save failed',
        color: 'red'
      })
    )
  })
})
