import {act, renderHook, waitFor} from '@/test-utils'
import {describe, expect, it, vi} from 'vitest'
import {useOptimisticMutation} from './useOptimisticMutation'

interface CountState {
  count: number
}

const computeNext = (committed: CountState, delta: number): CountState => ({
  count: committed.count + delta
})

describe('useOptimisticMutation', () => {
  it('initializes with the provided state', () => {
    const mutationFn = vi.fn()
    const {result} = renderHook(() =>
      useOptimisticMutation({count: 0}, computeNext, mutationFn)
    )

    expect(result.current.state).toEqual({count: 0})
    expect(result.current.isPending).toBe(false)
    expect(typeof result.current.mutate).toBe('function')
  })

  it('applies optimistic update immediately on mutate', async () => {
    const mutationFn = vi.fn(async () => ({success: true as const}))
    const {result} = renderHook(() =>
      useOptimisticMutation({count: 0}, computeNext, mutationFn)
    )

    act(() => {
      result.current.mutate(1)
    })

    expect(result.current.state).toEqual({count: 1})
    expect(result.current.isPending).toBe(true)

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })
  })

  it('commits optimistic state on success', async () => {
    const mutationFn = vi.fn(async () => ({success: true as const}))
    const {result} = renderHook(() =>
      useOptimisticMutation({count: 0}, computeNext, mutationFn)
    )

    act(() => {
      result.current.mutate(1)
    })

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    expect(result.current.state).toEqual({count: 1})
    expect(mutationFn).toHaveBeenCalledWith({count: 1}, 1)
  })

  it('reverts optimistic state on failure', async () => {
    const mutationFn = vi.fn(async () => ({
      success: false as const,
      error: 'API error'
    }))
    const {result} = renderHook(() =>
      useOptimisticMutation({count: 0}, computeNext, mutationFn)
    )

    act(() => {
      result.current.mutate(1)
    })

    expect(result.current.state).toEqual({count: 1})

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    expect(result.current.state).toEqual({count: 0})
  })

  it('prevents race conditions by ignoring mutate while pending', async () => {
    const mutationFn = vi.fn(async () => ({success: true as const}))
    const {result} = renderHook(() =>
      useOptimisticMutation({count: 0}, computeNext, mutationFn)
    )

    act(() => {
      result.current.mutate(1)
    })

    expect(result.current.isPending).toBe(true)

    act(() => {
      result.current.mutate(1)
    })

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    expect(mutationFn).toHaveBeenCalledTimes(1)
  })
})
