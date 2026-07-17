import {act, renderHook, waitFor} from '@/test-utils'
import {describe, expect, it, vi, beforeEach} from 'vitest'
import {useSubscribe} from './useSubscribe'
import {toggleSubscription} from '@/lib/actions/reddit/subreddits'

vi.mock('@/lib/actions/reddit/subreddits', () => ({
  toggleSubscription: vi.fn(async () => ({success: true}))
}))

const mockToggleSubscription = vi.mocked(toggleSubscription)

describe('useSubscribe', () => {
  const mockOptions = {
    subredditName: 'testsub',
    initialIsSubscribed: false
  }

  beforeEach(() => {
    mockToggleSubscription.mockClear()
  })

  it('initializes with correct default values', () => {
    const {result} = renderHook(() => useSubscribe(mockOptions))

    expect(result.current.isSubscribed).toBe(false)
    expect(result.current.isPending).toBe(false)
    expect(typeof result.current.toggleSubscribe).toBe('function')
  })

  it('initializes with subscribed state when initialIsSubscribed is true', () => {
    const {result} = renderHook(() =>
      useSubscribe({...mockOptions, initialIsSubscribed: true})
    )

    expect(result.current.isSubscribed).toBe(true)
  })

  it('performs optimistic update on subscribe', async () => {
    const {result} = renderHook(() => useSubscribe(mockOptions))

    act(() => {
      result.current.toggleSubscribe()
    })

    expect(result.current.isSubscribed).toBe(true)
    expect(result.current.isPending).toBe(true)

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    expect(mockToggleSubscription).toHaveBeenCalledWith('testsub', 'sub')
  })

  it('performs optimistic update on unsubscribe', async () => {
    const {result} = renderHook(() =>
      useSubscribe({...mockOptions, initialIsSubscribed: true})
    )

    act(() => {
      result.current.toggleSubscribe()
    })

    expect(result.current.isSubscribed).toBe(false)
    expect(result.current.isPending).toBe(true)

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    expect(mockToggleSubscription).toHaveBeenCalledWith('testsub', 'unsub')
  })

  it('reverts on subscribe failure', async () => {
    mockToggleSubscription.mockResolvedValueOnce({
      success: false,
      error: 'Network error'
    })

    const {result} = renderHook(() => useSubscribe(mockOptions))

    act(() => {
      result.current.toggleSubscribe()
    })

    expect(result.current.isSubscribed).toBe(true)

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    expect(result.current.isSubscribed).toBe(false)
  })

  it('reverts on unsubscribe failure', async () => {
    mockToggleSubscription.mockResolvedValueOnce({
      success: false,
      error: 'Network error'
    })

    const {result} = renderHook(() =>
      useSubscribe({...mockOptions, initialIsSubscribed: true})
    )

    act(() => {
      result.current.toggleSubscribe()
    })

    expect(result.current.isSubscribed).toBe(false)

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    expect(result.current.isSubscribed).toBe(true)
  })

  it('prevents race conditions during pending state', async () => {
    const {result} = renderHook(() => useSubscribe(mockOptions))

    act(() => {
      result.current.toggleSubscribe()
    })

    expect(result.current.isPending).toBe(true)

    // Try to toggle again while pending
    act(() => {
      result.current.toggleSubscribe()
    })

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    // Should only call API once
    expect(mockToggleSubscription).toHaveBeenCalledTimes(1)
  })
})
