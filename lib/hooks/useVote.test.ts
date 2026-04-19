import {renderHook} from '@/test-utils'
import {describe, expect, it, vi} from 'vitest'
import {useVote} from './useVote'

vi.mock('@/lib/actions/reddit/users', () => ({
  votePost: vi.fn(async () => ({success: true}))
}))

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
})
