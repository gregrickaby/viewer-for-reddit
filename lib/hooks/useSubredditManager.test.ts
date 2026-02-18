import {toggleSubscription} from '@/lib/actions/reddit'
import {act, renderHook, waitFor} from '@/test-utils'
import {beforeEach, describe, expect, it, vi} from 'vitest'
import {useSubredditManager} from './useSubredditManager'

vi.mock('@/lib/actions/reddit', () => ({
  toggleSubscription: vi.fn(async () => ({success: true}))
}))

vi.mock('@/lib/utils/logger', () => ({
  logger: {error: vi.fn()}
}))

const mockToggle = vi.mocked(toggleSubscription)

const initialSubscriptions = [
  {name: 'programming', displayName: 'r/programming', icon: ''},
  {name: 'javascript', displayName: 'r/javascript', icon: ''}
]

describe('useSubredditManager', () => {
  beforeEach(() => {
    mockToggle.mockClear()
    mockToggle.mockResolvedValue({success: true})
  })

  it('initializes with provided subscriptions', () => {
    const {result} = renderHook(() =>
      useSubredditManager({initialSubscriptions})
    )

    expect(result.current.subscriptions).toHaveLength(2)
    expect(result.current.isPending).toBe(false)
    expect(result.current.error).toBeNull()
  })

  describe('isSubscribed', () => {
    it('returns true for subscribed subreddits', () => {
      const {result} = renderHook(() =>
        useSubredditManager({initialSubscriptions})
      )

      expect(result.current.isSubscribed('programming')).toBe(true)
    })

    it('returns false for unsubscribed subreddits', () => {
      const {result} = renderHook(() =>
        useSubredditManager({initialSubscriptions})
      )

      expect(result.current.isSubscribed('typescript')).toBe(false)
    })

    it('is case-insensitive', () => {
      const {result} = renderHook(() =>
        useSubredditManager({initialSubscriptions})
      )

      expect(result.current.isSubscribed('PROGRAMMING')).toBe(true)
    })
  })

  describe('join', () => {
    it('optimistically adds subscription', async () => {
      const {result} = renderHook(() =>
        useSubredditManager({initialSubscriptions})
      )

      act(() => {
        result.current.join({name: 'typescript', displayName: 'r/typescript'})
      })

      // Optimistic update is immediate
      expect(result.current.isSubscribed('typescript')).toBe(true)
      expect(result.current.subscriptions).toHaveLength(3)

      await waitFor(() => {
        expect(result.current.isPending).toBe(false)
      })

      expect(mockToggle).toHaveBeenCalledWith('typescript', 'sub')
    })

    it('rolls back on failure', async () => {
      mockToggle.mockResolvedValueOnce({
        success: false,
        error: 'Failed to subscribe'
      })

      const {result} = renderHook(() =>
        useSubredditManager({initialSubscriptions})
      )

      act(() => {
        result.current.join({name: 'typescript', displayName: 'r/typescript'})
      })

      await waitFor(() => {
        expect(result.current.isPending).toBe(false)
      })

      expect(result.current.subscriptions).toHaveLength(2)
      expect(result.current.isSubscribed('typescript')).toBe(false)
      expect(result.current.error).toBe('Failed to subscribe')
    })

    it('prevents race conditions', async () => {
      const {result} = renderHook(() =>
        useSubredditManager({initialSubscriptions})
      )

      act(() => {
        result.current.join({name: 'typescript', displayName: 'r/typescript'})
      })

      expect(result.current.isPending).toBe(true)

      act(() => {
        result.current.join({name: 'rust', displayName: 'r/rust'})
      })

      await waitFor(() => {
        expect(result.current.isPending).toBe(false)
      })

      // Second join was ignored (isPending guard)
      expect(mockToggle).toHaveBeenCalledTimes(1)
    })
  })

  describe('leave', () => {
    it('optimistically removes subscription', async () => {
      const {result} = renderHook(() =>
        useSubredditManager({initialSubscriptions})
      )

      act(() => {
        result.current.leave('programming')
      })

      // Optimistic removal is immediate
      expect(result.current.isSubscribed('programming')).toBe(false)
      expect(result.current.subscriptions).toHaveLength(1)

      await waitFor(() => {
        expect(result.current.isPending).toBe(false)
      })

      expect(mockToggle).toHaveBeenCalledWith('programming', 'unsub')
    })

    it('rolls back on failure', async () => {
      mockToggle.mockResolvedValueOnce({
        success: false,
        error: 'Failed to unsubscribe'
      })

      const {result} = renderHook(() =>
        useSubredditManager({initialSubscriptions})
      )

      act(() => {
        result.current.leave('programming')
      })

      await waitFor(() => {
        expect(result.current.isPending).toBe(false)
      })

      expect(result.current.subscriptions).toHaveLength(2)
      expect(result.current.isSubscribed('programming')).toBe(true)
      expect(result.current.error).toBe('Failed to unsubscribe')
    })

    it('prevents race conditions', async () => {
      const {result} = renderHook(() =>
        useSubredditManager({initialSubscriptions})
      )

      act(() => {
        result.current.leave('programming')
      })

      expect(result.current.isPending).toBe(true)

      act(() => {
        result.current.leave('javascript')
      })

      await waitFor(() => {
        expect(result.current.isPending).toBe(false)
      })

      // Second leave was ignored (isPending guard)
      expect(mockToggle).toHaveBeenCalledTimes(1)
    })
  })

  describe('clearError', () => {
    it('clears the error state', async () => {
      mockToggle.mockResolvedValueOnce({
        success: false,
        error: 'Something failed'
      })

      const {result} = renderHook(() =>
        useSubredditManager({initialSubscriptions})
      )

      act(() => {
        result.current.leave('programming')
      })

      await waitFor(() => {
        expect(result.current.error).toBe('Something failed')
      })

      act(() => {
        result.current.clearError()
      })

      expect(result.current.error).toBeNull()
    })
  })
})
