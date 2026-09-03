import {act, renderHook, waitFor} from '@/test-utils'
import {describe, expect, it, vi} from 'vitest'
import {useVote} from './useVote'
import {votePost} from '@/lib/actions/reddit/users'

vi.mock('@/lib/actions/reddit/users', () => ({
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
    expect(typeof result.current.vote).toBe('function')
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

  it('resets to 0 when the same direction is voted twice', async () => {
    mockVotePost.mockClear()
    const {result} = renderHook(() => useVote(mockOptions))

    act(() => {
      result.current.vote(1)
    })
    await waitFor(() => expect(result.current.isPending).toBe(false))
    expect(result.current.voteState).toBe(1)
    expect(result.current.score).toBe(101)

    act(() => {
      result.current.vote(1)
    })
    await waitFor(() => expect(result.current.isPending).toBe(false))

    expect(result.current.voteState).toBe(0)
    expect(result.current.score).toBe(100)
    expect(mockVotePost).toHaveBeenLastCalledWith('t3_test123', 0)
  })
})
