import {renderHook} from '@/test-utils'
import {describe, expect, it, vi} from 'vitest'
import {useFollowUser} from './useFollowUser'

vi.mock('@/lib/actions/reddit/users', () => ({
  followUser: vi.fn(async () => ({success: true})),
  unfollowUser: vi.fn(async () => ({success: true}))
}))

vi.mock('@/lib/axiom/client', () => ({
  logger: {error: vi.fn()}
}))

describe('useFollowUser', () => {
  it('initializes with correct default values', () => {
    const {result} = renderHook(() =>
      useFollowUser({username: 'testuser', initialIsFollowing: false})
    )

    expect(result.current.isFollowing).toBe(false)
    expect(result.current.isPending).toBe(false)
    expect(typeof result.current.toggleFollow).toBe('function')
  })

  it('initializes as following when initialIsFollowing is true', () => {
    const {result} = renderHook(() =>
      useFollowUser({username: 'testuser', initialIsFollowing: true})
    )

    expect(result.current.isFollowing).toBe(true)
  })
})
