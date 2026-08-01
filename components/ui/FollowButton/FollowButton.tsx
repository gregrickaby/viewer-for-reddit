'use client'

import {ToggleButton} from '@/components/ui/ToggleButton/ToggleButton'
import {useFollowUser} from '@/lib/hooks/useFollowUser'
import {IconUserCheck, IconUserPlus} from '@tabler/icons-react'

interface FollowButtonProps {
  /** Reddit username (without the u/ prefix) */
  username: string
  /** Initial follow state from the server */
  initialIsFollowing: boolean
}

/**
 * Button for following or unfollowing a Reddit user.
 * Uses optimistic updates with automatic rollback on failure.
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
    <ToggleButton
      active={isFollowing}
      isPending={isPending}
      onToggle={toggleFollow}
      activeLabel="Following"
      inactiveLabel="Follow"
      activeIcon={<IconUserCheck size={16} />}
      inactiveIcon={<IconUserPlus size={16} />}
      activeAriaLabel={`Unfollow u/${username}`}
      inactiveAriaLabel={`Follow u/${username}`}
    />
  )
}
