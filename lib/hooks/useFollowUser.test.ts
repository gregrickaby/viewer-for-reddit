import {followUser, unfollowUser} from '@/lib/actions/reddit'
import {act, renderHook, waitFor} from '@/test-utils'
import {beforeEach, describe, expect, it, vi} from 'vitest'
import {useFollowUser} from './useFollowUser'

vi.mock('@/lib/actions/reddit', () => ({
  followUser: vi.fn(async () => ({success: true})),
  unfollowUser: vi.fn(async () => ({success: true}))
}))

const mockFollowUser = vi.mocked(followUser)
const mockUnfollowUser = vi.mocked(unfollowUser)

describe('useFollowUser', () => {
  beforeEach(() => {
    mockFollowUser.mockClear()
    mockUnfollowUser.mockClear()
  })

  it('initializes with correct default values', () => {
    const {result} = renderHook(() =>
      useFollowUser({username: 'testuser', initialIsFollowing: false})
    )

    expect(result.current.isFollowing).toBe(false)
    expect(result.current.isPending).toBe(false)
  })

  it('initializes as following when initialIsFollowing is true', () => {
    const {result} = renderHook(() =>
      useFollowUser({username: 'testuser', initialIsFollowing: true})
    )

    expect(result.current.isFollowing).toBe(true)
  })

  it('optimistically follows a user', async () => {
    const {result} = renderHook(() =>
      useFollowUser({username: 'testuser', initialIsFollowing: false})
    )

    act(() => {
      result.current.toggleFollow()
    })

    expect(result.current.isFollowing).toBe(true)

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    expect(mockFollowUser).toHaveBeenCalledWith('testuser')
    expect(mockUnfollowUser).not.toHaveBeenCalled()
  })

  it('optimistically unfollows a user', async () => {
    const {result} = renderHook(() =>
      useFollowUser({username: 'testuser', initialIsFollowing: true})
    )

    act(() => {
      result.current.toggleFollow()
    })

    expect(result.current.isFollowing).toBe(false)

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    expect(mockUnfollowUser).toHaveBeenCalledWith('testuser')
    expect(mockFollowUser).not.toHaveBeenCalled()
  })

  it('rolls back on follow failure', async () => {
    mockFollowUser.mockResolvedValueOnce({success: false, error: 'API error'})

    const {result} = renderHook(() =>
      useFollowUser({username: 'testuser', initialIsFollowing: false})
    )

    act(() => {
      result.current.toggleFollow()
    })

    expect(result.current.isFollowing).toBe(true)

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    expect(result.current.isFollowing).toBe(false)
  })

  it('rolls back on unfollow failure', async () => {
    mockUnfollowUser.mockResolvedValueOnce({success: false, error: 'API error'})

    const {result} = renderHook(() =>
      useFollowUser({username: 'testuser', initialIsFollowing: true})
    )

    act(() => {
      result.current.toggleFollow()
    })

    expect(result.current.isFollowing).toBe(false)

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    expect(result.current.isFollowing).toBe(true)
  })

  it('prevents race conditions when isPending', async () => {
    const {result} = renderHook(() =>
      useFollowUser({username: 'testuser', initialIsFollowing: false})
    )

    act(() => {
      result.current.toggleFollow()
    })

    expect(result.current.isPending).toBe(true)

    act(() => {
      result.current.toggleFollow()
    })

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    expect(mockFollowUser).toHaveBeenCalledTimes(1)
  })
})
