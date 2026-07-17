import {act, renderHook, waitFor} from '@/test-utils'
import {describe, expect, it, vi, beforeEach} from 'vitest'
import {useFollowUser} from './useFollowUser'
import {followUser, unfollowUser} from '@/lib/actions/reddit/users'

vi.mock('@/lib/actions/reddit/users', () => ({
  followUser: vi.fn(async () => ({success: true})),
  unfollowUser: vi.fn(async () => ({success: true}))
}))

const mockFollowUser = vi.mocked(followUser)
const mockUnfollowUser = vi.mocked(unfollowUser)

describe('useFollowUser', () => {
  const mockOptions = {
    username: 'testuser',
    initialIsFollowing: false
  }

  beforeEach(() => {
    mockFollowUser.mockClear()
    mockUnfollowUser.mockClear()
  })

  it('initializes with correct default values', () => {
    const {result} = renderHook(() => useFollowUser(mockOptions))

    expect(result.current.isFollowing).toBe(false)
    expect(result.current.isPending).toBe(false)
    expect(typeof result.current.toggleFollow).toBe('function')
  })

  it('initializes with following state when initialIsFollowing is true', () => {
    const {result} = renderHook(() =>
      useFollowUser({...mockOptions, initialIsFollowing: true})
    )

    expect(result.current.isFollowing).toBe(true)
  })

  it('toggles follow state optimistically', async () => {
    const {result} = renderHook(() => useFollowUser(mockOptions))

    act(() => {
      result.current.toggleFollow()
    })

    expect(result.current.isFollowing).toBe(true)
    expect(result.current.isPending).toBe(true)

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    expect(mockFollowUser).toHaveBeenCalledWith('testuser')
  })

  it('toggles unfollow state optimistically', async () => {
    const {result} = renderHook(() =>
      useFollowUser({...mockOptions, initialIsFollowing: true})
    )

    act(() => {
      result.current.toggleFollow()
    })

    expect(result.current.isFollowing).toBe(false)
    expect(result.current.isPending).toBe(true)

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    expect(mockUnfollowUser).toHaveBeenCalledWith('testuser')
  })

  it('reverts on follow failure', async () => {
    mockFollowUser.mockResolvedValueOnce({
      success: false,
      error: 'Rate limited'
    })

    const {result} = renderHook(() => useFollowUser(mockOptions))

    act(() => {
      result.current.toggleFollow()
    })

    expect(result.current.isFollowing).toBe(true)

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    expect(result.current.isFollowing).toBe(false)
  })

  it('reverts on unfollow failure', async () => {
    mockUnfollowUser.mockResolvedValueOnce({
      success: false,
      error: 'Network error'
    })

    const {result} = renderHook(() =>
      useFollowUser({...mockOptions, initialIsFollowing: true})
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

  it('prevents race conditions during pending state', async () => {
    const {result} = renderHook(() => useFollowUser(mockOptions))

    act(() => {
      result.current.toggleFollow()
    })

    expect(result.current.isPending).toBe(true)

    // Try to toggle again while pending
    act(() => {
      result.current.toggleFollow()
    })

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    // Should only call API once
    expect(mockFollowUser).toHaveBeenCalledTimes(1)
  })
})
