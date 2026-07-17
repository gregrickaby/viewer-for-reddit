import {act, renderHook, waitFor} from '@/test-utils'
import {describe, expect, it, vi, beforeEach} from 'vitest'
import {useSavePost} from './useSavePost'
import {savePost} from '@/lib/actions/reddit/users'

vi.mock('@/lib/actions/reddit/users', () => ({
  savePost: vi.fn(async () => ({success: true}))
}))

const mockSavePost = vi.mocked(savePost)

describe('useSavePost', () => {
  const mockOptions = {
    postName: 't3_test123',
    initialSaved: false,
    onUnsave: vi.fn()
  }

  beforeEach(() => {
    mockSavePost.mockClear()
    mockOptions.onUnsave.mockClear()
  })

  it('initializes with correct default values', () => {
    const {result} = renderHook(() => useSavePost(mockOptions))

    expect(result.current.isSaved).toBe(false)
    expect(result.current.isPending).toBe(false)
    expect(typeof result.current.toggleSave).toBe('function')
  })

  it('initializes with saved state when initialSaved is true', () => {
    const {result} = renderHook(() =>
      useSavePost({...mockOptions, initialSaved: true})
    )

    expect(result.current.isSaved).toBe(true)
  })

  it('toggles save state optimistically', async () => {
    const {result} = renderHook(() => useSavePost(mockOptions))

    act(() => {
      result.current.toggleSave()
    })

    expect(result.current.isSaved).toBe(true)
    expect(result.current.isPending).toBe(true)

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    expect(mockSavePost).toHaveBeenCalledWith('t3_test123', true)
  })

  it('toggles unsave state optimistically', async () => {
    const {result} = renderHook(() =>
      useSavePost({...mockOptions, initialSaved: true})
    )

    act(() => {
      result.current.toggleSave()
    })

    expect(result.current.isSaved).toBe(false)
    expect(result.current.isPending).toBe(true)

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    expect(mockSavePost).toHaveBeenCalledWith('t3_test123', false)
  })

  it('calls onUnsave callback on successful unsave', async () => {
    const onUnsave = vi.fn()
    const {result} = renderHook(() =>
      useSavePost({...mockOptions, initialSaved: true, onUnsave})
    )

    act(() => {
      result.current.toggleSave()
    })

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    expect(onUnsave).toHaveBeenCalledTimes(1)
  })

  it('does not call onUnsave on save', async () => {
    const onUnsave = vi.fn()
    const {result} = renderHook(() => useSavePost({...mockOptions, onUnsave}))

    act(() => {
      result.current.toggleSave()
    })

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    expect(onUnsave).not.toHaveBeenCalled()
  })

  it('reverts on save failure', async () => {
    mockSavePost.mockResolvedValueOnce({
      success: false,
      error: 'Rate limited'
    })

    const {result} = renderHook(() => useSavePost(mockOptions))

    act(() => {
      result.current.toggleSave()
    })

    expect(result.current.isSaved).toBe(true)

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    expect(result.current.isSaved).toBe(false)
  })

  it('reverts on unsave failure', async () => {
    mockSavePost.mockResolvedValueOnce({
      success: false,
      error: 'Network error'
    })

    const {result} = renderHook(() =>
      useSavePost({...mockOptions, initialSaved: true})
    )

    act(() => {
      result.current.toggleSave()
    })

    expect(result.current.isSaved).toBe(false)

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    expect(result.current.isSaved).toBe(true)
  })

  it('prevents race conditions during pending state', async () => {
    const {result} = renderHook(() => useSavePost(mockOptions))

    act(() => {
      result.current.toggleSave()
    })

    expect(result.current.isPending).toBe(true)

    // Try to toggle again while pending
    act(() => {
      result.current.toggleSave()
    })

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    // Should only call API once
    expect(mockSavePost).toHaveBeenCalledTimes(1)
  })
})
