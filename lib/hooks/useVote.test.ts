import {votePost} from '@/lib/actions/reddit'
import {act, renderHook, waitFor} from '@/test-utils'
import {describe, expect, it, vi} from 'vitest'
import {useVote} from './useVote'

// Mock the votePost action
vi.mock('@/lib/actions/reddit', () => ({
  votePost: vi.fn(async () => ({success: true}))
}))

const mockVotePost = vi.mocked(votePost)

describe('useVote', () => {
  const mockOptions = {
    itemName: 't3_test123',
    initialLikes: null,
    initialScore: 100
  }

  it('initializes with correct default values', () => {
    const {result} = renderHook(() => useVote(mockOptions))

    expect(result.current.voteState).toBe(0)
    expect(result.current.score).toBe(100)
    expect(result.current.isPending).toBe(false)
  })

  it('initializes with upvote state when initialLikes is true', () => {
    const {result} = renderHook(() =>
      useVote({...mockOptions, initialLikes: true})
    )

    expect(result.current.voteState).toBe(1)
  })

  it('initializes with downvote state when initialLikes is false', () => {
    const {result} = renderHook(() =>
      useVote({...mockOptions, initialLikes: false})
    )

    expect(result.current.voteState).toBe(-1)
  })

  it('handles upvote with optimistic update', async () => {
    const {result} = renderHook(() => useVote(mockOptions))

    // Initial state
    expect(result.current.voteState).toBe(0)
    expect(result.current.score).toBe(100)

    // Upvote
    act(() => {
      result.current.vote(1)
    })

    // Optimistic update should happen immediately
    expect(result.current.voteState).toBe(1)
    expect(result.current.score).toBe(101)
    expect(result.current.isPending).toBe(true)

    // Wait for API call to complete
    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    // State should remain after successful API call
    expect(result.current.voteState).toBe(1)
    expect(result.current.score).toBe(101)
  })

  it('handles downvote with optimistic update', async () => {
    const {result} = renderHook(() => useVote(mockOptions))

    // Downvote
    act(() => {
      result.current.vote(-1)
    })

    // Optimistic update
    expect(result.current.voteState).toBe(-1)
    expect(result.current.score).toBe(99)
    expect(result.current.isPending).toBe(true)

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    expect(result.current.voteState).toBe(-1)
    expect(result.current.score).toBe(99)
  })

  it('removes vote when clicking same direction twice', async () => {
    const {result} = renderHook(() => useVote(mockOptions))

    // First upvote
    act(() => {
      result.current.vote(1)
    })

    expect(result.current.voteState).toBe(1)
    expect(result.current.score).toBe(101)

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    // Second upvote (should remove vote)
    act(() => {
      result.current.vote(1)
    })

    expect(result.current.voteState).toBe(0)
    expect(result.current.score).toBe(100)

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })
  })

  it('changes vote from upvote to downvote', async () => {
    const {result} = renderHook(() =>
      useVote({...mockOptions, initialLikes: true, initialScore: 101})
    )

    // Initial upvote state
    expect(result.current.voteState).toBe(1)
    expect(result.current.score).toBe(101)

    // Change to downvote
    act(() => {
      result.current.vote(-1)
    })

    // Score should change by -2 (remove upvote +1, add downvote -1)
    expect(result.current.voteState).toBe(-1)
    expect(result.current.score).toBe(99)

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })
  })

  it('reverts optimistic update on API failure', async () => {
    // Mock API failure
    mockVotePost.mockResolvedValueOnce({
      success: false,
      error: 'Network error'
    })

    const {result} = renderHook(() => useVote(mockOptions))

    // Initial state
    expect(result.current.voteState).toBe(0)
    expect(result.current.score).toBe(100)

    // Attempt upvote
    act(() => {
      result.current.vote(1)
    })

    // Optimistic update happens
    expect(result.current.voteState).toBe(1)
    expect(result.current.score).toBe(101)

    // Wait for API call to fail and revert
    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    // Should revert to original state
    expect(result.current.voteState).toBe(0)
    expect(result.current.score).toBe(100)
  })

  it('prevents race conditions by ignoring votes while pending', async () => {
    const {result} = renderHook(() => useVote(mockOptions))

    // Start first vote
    act(() => {
      result.current.vote(1)
    })

    expect(result.current.isPending).toBe(true)
    expect(result.current.voteState).toBe(1)
    expect(result.current.score).toBe(101)

    // Try to vote again while pending (should be ignored)
    act(() => {
      result.current.vote(-1)
    })

    // State should not change
    expect(result.current.voteState).toBe(1)
    expect(result.current.score).toBe(101)

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })
  })

  it('handles server error response', async () => {
    // Mock server error
    mockVotePost.mockResolvedValueOnce({
      success: false,
      error: 'Server error'
    })

    const {result} = renderHook(() => useVote(mockOptions))

    act(() => {
      result.current.vote(1)
    })

    // Optimistic update
    expect(result.current.voteState).toBe(1)
    expect(result.current.score).toBe(101)

    // Wait for error and revert
    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    // Should revert
    expect(result.current.voteState).toBe(0)
    expect(result.current.score).toBe(100)
  })

  it('calculates score correctly for multiple vote changes', async () => {
    const {result} = renderHook(() => useVote(mockOptions))

    // Upvote (100 -> 101)
    act(() => {
      result.current.vote(1)
    })
    expect(result.current.score).toBe(101)

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    // Remove vote (101 -> 100)
    act(() => {
      result.current.vote(1)
    })
    expect(result.current.score).toBe(100)

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    // Downvote (100 -> 99)
    act(() => {
      result.current.vote(-1)
    })
    expect(result.current.score).toBe(99)

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })
  })
})
