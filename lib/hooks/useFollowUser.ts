'use client'

import {followUser, unfollowUser} from '@/lib/actions/reddit/users'
import {logger} from '@/lib/axiom/client'
import {useOptimisticToggle} from './primitives/useOptimisticToggle'

interface UseFollowUserOptions {
  username: string
  initialIsFollowing: boolean
}

interface UseFollowUserReturn {
  isFollowing: boolean
  isPending: boolean
  toggleFollow: () => void
}

/**
 * Toggles follow/unfollow state for a Reddit user with optimistic updates.
 *
 * @param options.username - The Reddit username.
 * @param options.initialIsFollowing - Current follow state.
 * @returns `isFollowing`, `isPending`, and `toggleFollow`.
 */
export function useFollowUser({
  username,
  initialIsFollowing
}: Readonly<UseFollowUserOptions>): UseFollowUserReturn {
  const {
    value: isFollowing,
    isPending,
    toggle: toggleFollow
  } = useOptimisticToggle(initialIsFollowing, async (next) => {
    const action = next ? 'follow' : 'unfollow'
    const result = next
      ? await followUser(username)
      : await unfollowUser(username)
    if (!result.success) {
      logger.error('Failed to toggle follow', {
        error: result.error,
        context: 'useFollowUser',
        username,
        action
      })
    }
    return result
  })

  return {isFollowing, isPending, toggleFollow}
}
