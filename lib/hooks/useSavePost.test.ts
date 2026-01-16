import {savePost} from '@/lib/actions/reddit'
import {act, renderHook, waitFor} from '@/test-utils'
import {beforeEach, describe, expect, it, vi} from 'vitest'
import {useSavePost} from './useSavePost'

// Mock the savePost action
vi.mock('@/lib/actions/reddit', () => ({
  savePost: vi.fn(async () => ({success: true}))
}))

const mockSavePost = vi.mocked(savePost)

describe('useSavePost', () => {
  const mockOptions = {
    postName: 't3_test123',
    initialSaved: false
  }

  beforeEach(() => {
    mockSavePost.mockClear()
    mockSavePost.mockResolvedValue({success: true})
  })

  it('initializes with correct default values', () => {
    const {result} = renderHook(() => useSavePost(mockOptions))

    expect(result.current.isSaved).toBe(false)
    expect(result.current.isPending).toBe(false)
  })

  it('initializes with saved state when initialSaved is true', () => {
    const {result} = renderHook(() =>
      useSavePost({...mockOptions, initialSaved: true})
    )

    expect(result.current.isSaved).toBe(true)
  })

  it('saves post with optimistic update', async () => {
    const {result} = renderHook(() => useSavePost(mockOptions))

    expect(result.current.isSaved).toBe(false)

    act(() => {
      result.current.toggleSave()
    })

    // Optimistic update should happen immediately
    expect(result.current.isSaved).toBe(true)
    expect(result.current.isPending).toBe(true)

    // Wait for API call to complete
    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    // State should remain after successful API call
    expect(result.current.isSaved).toBe(true)
    expect(mockSavePost).toHaveBeenCalledWith('t3_test123', true)
  })

  it('unsaves post with optimistic update', async () => {
    const {result} = renderHook(() =>
      useSavePost({...mockOptions, initialSaved: true})
    )

    expect(result.current.isSaved).toBe(true)

    act(() => {
      result.current.toggleSave()
    })

    // Optimistic update
    expect(result.current.isSaved).toBe(false)
    expect(result.current.isPending).toBe(true)

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    expect(result.current.isSaved).toBe(false)
    expect(mockSavePost).toHaveBeenCalledWith('t3_test123', false)
  })

  it('reverts optimistic update on API failure', async () => {
    mockSavePost.mockResolvedValueOnce({
      success: false,
      error: 'Network error'
    })

    const {result} = renderHook(() => useSavePost(mockOptions))

    expect(result.current.isSaved).toBe(false)

    act(() => {
      result.current.toggleSave()
    })

    // Optimistic update happens
    expect(result.current.isSaved).toBe(true)

    // Wait for API call to fail and revert
    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    // Should revert to original state
    expect(result.current.isSaved).toBe(false)
  })

  it('prevents race conditions by ignoring toggles while pending', async () => {
    let resolveSave: (value: any) => void
    mockSavePost.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSave = resolve
        })
    )

    const {result} = renderHook(() => useSavePost(mockOptions))

    // Start first save
    act(() => {
      result.current.toggleSave()
    })

    expect(result.current.isPending).toBe(true)
    expect(result.current.isSaved).toBe(true)

    // Try to toggle again while pending (should be ignored)
    act(() => {
      result.current.toggleSave()
    })

    // State should not change
    expect(result.current.isSaved).toBe(true)

    act(() => {
      resolveSave!({success: true})
    })

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    // Should only have been called once
    expect(mockSavePost).toHaveBeenCalledTimes(1)
  })

  it('maintains correct state after successful save and unsave', async () => {
    const {result} = renderHook(() => useSavePost(mockOptions))

    // Save
    act(() => {
      result.current.toggleSave()
    })

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    expect(result.current.isSaved).toBe(true)
    expect(mockSavePost).toHaveBeenCalledWith('t3_test123', true)

    // Unsave
    act(() => {
      result.current.toggleSave()
    })

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    expect(result.current.isSaved).toBe(false)
    expect(mockSavePost).toHaveBeenCalledWith('t3_test123', false)
  })
})
