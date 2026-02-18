'use client'

import {useFollowUser} from '@/lib/hooks'
import {Button} from '@mantine/core'
import {IconUserCheck, IconUserPlus} from '@tabler/icons-react'

interface FollowButtonProps {
  username: string
  initialIsFollowing: boolean
}

/**
 * Button component for following/unfollowing a Reddit user.
 * Uses optimistic updates with automatic rollback on failure.
 *
 * @param username - Reddit username (without 'u/' prefix)
 * @param initialIsFollowing - Initial follow state from server
 */
export function FollowButton({
  username,
  initialIsFollowing
}: Readonly<FollowButtonProps>) {
  const {isFollowing, isPending, toggleFollow} = useFollowUser({
    username,
    initialIsFollowing
  })

  return (
    <Button
      onClick={toggleFollow}
      disabled={isPending}
      variant={isFollowing ? 'light' : 'filled'}
      color={isFollowing ? 'gray' : 'blue'}
      leftSection={
        isFollowing ? <IconUserCheck size={16} /> : <IconUserPlus size={16} />
      }
      size="sm"
      aria-label={
        isFollowing ? `Unfollow u/${username}` : `Follow u/${username}`
      }
    >
      {isFollowing ? 'Following' : 'Follow'}
    </Button>
  )
}
