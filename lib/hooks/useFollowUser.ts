'use client'

import {followUser, unfollowUser} from '@/lib/actions/reddit'
import {logger} from '@/lib/utils/logger'
import {useState, useTransition} from 'react'

interface UseFollowUserOptions {
  username: string
  initialIsFollowing: boolean
}

/**
 * Hook for managing user follow state with optimistic updates.
 * Handles follow/unfollow actions with automatic rollback on failure.
 *
 * @param options - Configuration object
 * @param options.username - Reddit username to follow/unfollow
 * @param options.initialIsFollowing - Initial follow state from server
 * @returns Object containing follow state and toggle function
 *
 * @example
 * ```typescript
 * const {isFollowing, isPending, toggleFollow} = useFollowUser({
 *   username: 'spez',
 *   initialIsFollowing: false
 * })
 *
 * <Button onClick={toggleFollow} disabled={isPending}>
 *   {isFollowing ? 'Unfollow' : 'Follow'}
 * </Button>
 * ```
 */
export function useFollowUser({
  username,
  initialIsFollowing
}: Readonly<UseFollowUserOptions>) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing)
  const [isPending, startTransition] = useTransition()

  const toggleFollow = () => {
    if (isPending) return

    const previousState = isFollowing
    setIsFollowing(!isFollowing)

    startTransition(async () => {
      const result = isFollowing
        ? await unfollowUser(username)
        : await followUser(username)

      if (!result.success) {
        setIsFollowing(previousState)
        logger.error('Failed to toggle follow', result.error, {
          context: 'useFollowUser',
          username,
          action: isFollowing ? 'unfollow' : 'follow'
        })
      }
    })
  }

  return {
    isFollowing,
    isPending,
    toggleFollow
  }
}
