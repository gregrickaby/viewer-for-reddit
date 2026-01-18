import {toggleSubscription} from '@/lib/actions/reddit'
import {act, renderHook, waitFor} from '@/test-utils'
import {beforeEach, describe, expect, it, vi} from 'vitest'
import {useSubscribe} from './useSubscribe'

// Mock server actions to avoid env var errors
vi.mock('@/lib/actions/reddit', () => ({
  toggleSubscription: vi.fn(async () => ({success: true}))
}))

const mockToggleSubscription = vi.mocked(toggleSubscription)

describe('useSubscribe', () => {
  beforeEach(() => {
    mockToggleSubscription.mockClear()
    mockToggleSubscription.mockResolvedValue({success: true})
  })

  describe('initialization', () => {
    it('initializes with correct default values when not subscribed', () => {
      const {result} = renderHook(() =>
        useSubscribe({
          subredditName: 'ProgrammerHumor',
          initialIsSubscribed: false
        })
      )

      expect(result.current.isSubscribed).toBe(false)
      expect(result.current.isPending).toBe(false)
      expect(typeof result.current.toggleSubscribe).toBe('function')
    })

    it('initializes with correct default values when subscribed', () => {
      const {result} = renderHook(() =>
        useSubscribe({
          subredditName: 'ProgrammerHumor',
          initialIsSubscribed: true
        })
      )

      expect(result.current.isSubscribed).toBe(true)
      expect(result.current.isPending).toBe(false)
    })
  })

  describe('subscribe action', () => {
    it('subscribes to subreddit with optimistic update', async () => {
      const {result} = renderHook(() =>
        useSubscribe({
          subredditName: 'ProgrammerHumor',
          initialIsSubscribed: false
        })
      )

      expect(result.current.isSubscribed).toBe(false)

      act(() => {
        result.current.toggleSubscribe()
      })

      // Optimistic update happens immediately
      expect(result.current.isSubscribed).toBe(true)

      await waitFor(() => {
        expect(result.current.isPending).toBe(false)
      })

      // Should call server action with 'sub'
      expect(mockToggleSubscription).toHaveBeenCalledWith(
        'ProgrammerHumor',
        'sub'
      )
      expect(mockToggleSubscription).toHaveBeenCalledTimes(1)
    })

    it('maintains subscribed state after successful subscribe', async () => {
      const {result} = renderHook(() =>
        useSubscribe({
          subredditName: 'javascript',
          initialIsSubscribed: false
        })
      )

      act(() => {
        result.current.toggleSubscribe()
      })

      await waitFor(() => {
        expect(result.current.isPending).toBe(false)
      })

      // State should remain true after successful operation
      expect(result.current.isSubscribed).toBe(true)
    })
  })

  describe('unsubscribe action', () => {
    it('unsubscribes from subreddit with optimistic update', async () => {
      const {result} = renderHook(() =>
        useSubscribe({
          subredditName: 'programming',
          initialIsSubscribed: true
        })
      )

      expect(result.current.isSubscribed).toBe(true)

      act(() => {
        result.current.toggleSubscribe()
      })

      // Optimistic update happens immediately
      expect(result.current.isSubscribed).toBe(false)

      await waitFor(() => {
        expect(result.current.isPending).toBe(false)
      })

      // Should call server action with 'unsub'
      expect(mockToggleSubscription).toHaveBeenCalledWith(
        'programming',
        'unsub'
      )
      expect(mockToggleSubscription).toHaveBeenCalledTimes(1)
    })

    it('maintains unsubscribed state after successful unsubscribe', async () => {
      const {result} = renderHook(() =>
        useSubscribe({
          subredditName: 'webdev',
          initialIsSubscribed: true
        })
      )

      act(() => {
        result.current.toggleSubscribe()
      })

      await waitFor(() => {
        expect(result.current.isPending).toBe(false)
      })

      // State should remain false after successful operation
      expect(result.current.isSubscribed).toBe(false)
    })
  })

  describe('error handling', () => {
    it('reverts subscription state on failure', async () => {
      mockToggleSubscription.mockResolvedValueOnce({
        success: false,
        error: 'Network error'
      })

      const {result} = renderHook(() =>
        useSubscribe({
          subredditName: 'ProgrammerHumor',
          initialIsSubscribed: false
        })
      )

      expect(result.current.isSubscribed).toBe(false)

      act(() => {
        result.current.toggleSubscribe()
      })

      // Optimistic update happens immediately
      await waitFor(() => {
        expect(result.current.isSubscribed).toBe(true)
      })

      // Wait for transition to complete
      await waitFor(() => {
        expect(result.current.isPending).toBe(false)
      })

      // Should revert to original state (false)
      expect(result.current.isSubscribed).toBe(false)
    })

    it('reverts unsubscribe state on failure', async () => {
      mockToggleSubscription.mockResolvedValueOnce({
        success: false,
        error: 'Rate limit exceeded'
      })

      const {result} = renderHook(() =>
        useSubscribe({
          subredditName: 'programming',
          initialIsSubscribed: true
        })
      )

      const initialState = result.current.isSubscribed

      act(() => {
        result.current.toggleSubscribe()
      })

      // Optimistic update
      expect(result.current.isSubscribed).toBe(false)

      await waitFor(() => {
        expect(result.current.isPending).toBe(false)
      })

      // Should revert to original state
      expect(result.current.isSubscribed).toBe(initialState)
    })

    it('logs error to console on failure', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      mockToggleSubscription.mockResolvedValueOnce({
        success: false,
        error: 'Authentication required'
      })

      const {result} = renderHook(() =>
        useSubscribe({
          subredditName: 'ProgrammerHumor',
          initialIsSubscribed: false
        })
      )

      act(() => {
        result.current.toggleSubscribe()
      })

      await waitFor(() => {
        expect(result.current.isPending).toBe(false)
      })

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to toggle subscription:',
        'Authentication required'
      )

      consoleSpy.mockRestore()
    })
  })

  describe('race condition prevention', () => {
    it('prevents multiple simultaneous subscribe calls', async () => {
      // Make the server action take time to complete
      mockToggleSubscription.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({success: true}), 50)
          )
      )

      const {result} = renderHook(() =>
        useSubscribe({
          subredditName: 'ProgrammerHumor',
          initialIsSubscribed: false
        })
      )

      // First call
      act(() => {
        result.current.toggleSubscribe()
      })

      // Try second call immediately (should be ignored due to isPending check)
      act(() => {
        result.current.toggleSubscribe()
      })

      // Wait for the operation to complete
      await waitFor(() => {
        expect(result.current.isPending).toBe(false)
      })

      // Only one API call should have been made
      expect(mockToggleSubscription).toHaveBeenCalledTimes(1)
    })

    it('prevents toggle during pending state', async () => {
      // Make the server action take time to complete
      mockToggleSubscription.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({success: true}), 50)
          )
      )

      const {result} = renderHook(() =>
        useSubscribe({
          subredditName: 'programming',
          initialIsSubscribed: true
        })
      )

      // First call
      act(() => {
        result.current.toggleSubscribe()
      })

      // Multiple rapid clicks should be ignored
      act(() => {
        result.current.toggleSubscribe()
        result.current.toggleSubscribe()
        result.current.toggleSubscribe()
      })

      await waitFor(() => {
        expect(result.current.isPending).toBe(false)
      })

      // Only the first call should go through
      expect(mockToggleSubscription).toHaveBeenCalledTimes(1)
    })
  })

  describe('multiple toggle operations', () => {
    it('handles subscribe then unsubscribe sequence', async () => {
      const {result} = renderHook(() =>
        useSubscribe({
          subredditName: 'ProgrammerHumor',
          initialIsSubscribed: false
        })
      )

      // First subscribe
      act(() => {
        result.current.toggleSubscribe()
      })

      await waitFor(() => {
        expect(result.current.isPending).toBe(false)
      })

      expect(result.current.isSubscribed).toBe(true)
      expect(mockToggleSubscription).toHaveBeenCalledWith(
        'ProgrammerHumor',
        'sub'
      )

      // Then unsubscribe
      act(() => {
        result.current.toggleSubscribe()
      })

      await waitFor(() => {
        expect(result.current.isPending).toBe(false)
      })

      expect(result.current.isSubscribed).toBe(false)
      expect(mockToggleSubscription).toHaveBeenCalledWith(
        'ProgrammerHumor',
        'unsub'
      )
      expect(mockToggleSubscription).toHaveBeenCalledTimes(2)
    })

    it('handles unsubscribe then subscribe sequence', async () => {
      const {result} = renderHook(() =>
        useSubscribe({
          subredditName: 'webdev',
          initialIsSubscribed: true
        })
      )

      // First unsubscribe
      act(() => {
        result.current.toggleSubscribe()
      })

      await waitFor(() => {
        expect(result.current.isPending).toBe(false)
      })

      expect(result.current.isSubscribed).toBe(false)
      expect(mockToggleSubscription).toHaveBeenCalledWith('webdev', 'unsub')

      // Then subscribe again
      act(() => {
        result.current.toggleSubscribe()
      })

      await waitFor(() => {
        expect(result.current.isPending).toBe(false)
      })

      expect(result.current.isSubscribed).toBe(true)
      expect(mockToggleSubscription).toHaveBeenCalledWith('webdev', 'sub')
      expect(mockToggleSubscription).toHaveBeenCalledTimes(2)
    })
  })

  describe('edge cases', () => {
    it('handles subreddit name with special characters', async () => {
      const {result} = renderHook(() =>
        useSubscribe({
          subredditName: 'test-subreddit_name',
          initialIsSubscribed: false
        })
      )

      act(() => {
        result.current.toggleSubscribe()
      })

      await waitFor(() => {
        expect(result.current.isPending).toBe(false)
      })

      expect(mockToggleSubscription).toHaveBeenCalledWith(
        'test-subreddit_name',
        'sub'
      )
    })

    it('maintains state across rapid successful operations', async () => {
      const {result} = renderHook(() =>
        useSubscribe({
          subredditName: 'ProgrammerHumor',
          initialIsSubscribed: false
        })
      )

      // Subscribe
      act(() => {
        result.current.toggleSubscribe()
      })

      await waitFor(() => {
        expect(result.current.isPending).toBe(false)
      })

      expect(result.current.isSubscribed).toBe(true)

      // Immediately unsubscribe
      act(() => {
        result.current.toggleSubscribe()
      })

      await waitFor(() => {
        expect(result.current.isPending).toBe(false)
      })

      expect(result.current.isSubscribed).toBe(false)

      // Subscribe again
      act(() => {
        result.current.toggleSubscribe()
      })

      await waitFor(() => {
        expect(result.current.isPending).toBe(false)
      })

      expect(result.current.isSubscribed).toBe(true)
      expect(mockToggleSubscription).toHaveBeenCalledTimes(3)
    })
  })
})
