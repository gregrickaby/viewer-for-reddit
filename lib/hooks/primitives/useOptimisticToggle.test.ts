import {act, renderHook, waitFor} from '@/test-utils'
import {describe, expect, it, vi} from 'vitest'
import {useOptimisticToggle} from './useOptimisticToggle'

describe('useOptimisticToggle', () => {
  it('initializes with the provided value', () => {
    const mutationFn = vi.fn()
    const {result} = renderHook(() => useOptimisticToggle(false, mutationFn))

    expect(result.current.value).toBe(false)
    expect(result.current.isPending).toBe(false)
    expect(typeof result.current.toggle).toBe('function')
  })

  it('applies optimistic update immediately on toggle', async () => {
    const mutationFn = vi.fn(async () => ({success: true as const}))
    const {result} = renderHook(() => useOptimisticToggle(false, mutationFn))

    act(() => {
      result.current.toggle()
    })

    expect(result.current.value).toBe(true)
    expect(result.current.isPending).toBe(true)

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })
  })

  it('commits optimistic value on success', async () => {
    const mutationFn = vi.fn(async () => ({success: true as const}))
    const {result} = renderHook(() => useOptimisticToggle(false, mutationFn))

    act(() => {
      result.current.toggle()
    })

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    expect(result.current.value).toBe(true)
    expect(mutationFn).toHaveBeenCalledWith(true)
  })

  it('reverts optimistic value on failure', async () => {
    const mutationFn = vi.fn(async () => ({
      success: false as const,
      error: 'Network error'
    }))
    const {result} = renderHook(() => useOptimisticToggle(false, mutationFn))

    act(() => {
      result.current.toggle()
    })

    expect(result.current.value).toBe(true)

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    expect(result.current.value).toBe(false)
  })

  it('prevents race conditions by ignoring toggle while pending', async () => {
    const mutationFn = vi.fn(async () => ({success: true as const}))
    const {result} = renderHook(() => useOptimisticToggle(false, mutationFn))

    act(() => {
      result.current.toggle()
    })

    expect(result.current.isPending).toBe(true)

    act(() => {
      result.current.toggle()
    })

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    expect(mutationFn).toHaveBeenCalledTimes(1)
  })
})
