'use client'

import {useVote} from '@/lib/hooks/useVote'
import {ActionIcon, Group, NumberFormatter, Text, Tooltip} from '@mantine/core'
import {BiSolidDownvote, BiSolidUpvote} from 'react-icons/bi'
import classes from './VoteButtons.module.css'

export interface VoteButtonsProps {
  /**
   * Thing ID (fullname) - e.g., t3_abc123 for post, t1_xyz789 for comment
   */
  id: string

  /**
   * Current vote score (upvotes)
   */
  score: number

  /**
   * User's current vote state
   * - true: upvoted
   * - false: downvoted
   * - null/undefined: no vote
   */
  userVote?: boolean | null

  /**
   * Size variant for the buttons
   */
  size?: 'sm' | 'md' | 'lg'
}

/**
 * VoteButtons component for upvoting/downvoting posts and comments.
 * Designed to match Reddit's voting UI with vertical arrow layout.
 *
 * Features:
 * - Upvote and downvote buttons (vertical layout like Reddit)
 * - Visual feedback for current vote state
 * - Optimistic UI updates via useVote hook
 * - Error handling with notifications
 * - Keyboard accessible
 * - Disabled state when not authenticated
 *
 * @param {VoteButtonsProps} props - Component props
 */
export function VoteButtons({
  id,
  score,
  userVote,
  size = 'md'
}: Readonly<VoteButtonsProps>) {
  // Use the vote hook for all business logic
  const {handleVote, currentVote, currentScore, isVoting} = useVote({
    id,
    initialScore: score,
    initialVote: userVote
  })

  // Icon size mapping based on button size variant
  const iconSizes = {sm: 16, md: 20, lg: 24} as const
  const iconSize = iconSizes[size]

  const isUpvoted = currentVote === true
  const isDownvoted = currentVote === false

  // Determine text color based on vote state (Reddit style: orange for upvote, blue for downvote)
  let scoreColor: string = 'dimmed'
  if (isUpvoted) scoreColor = 'orange'
  if (isDownvoted) scoreColor = 'blue'

  // Set action icon size based on button size
  let actionIconSize: 'sm' | 'md' = 'sm'
  if (size === 'lg') actionIconSize = 'md'

  // Set text size based on button size
  let textSize: 'xs' | 'sm' | 'md' = 'sm'
  if (size === 'sm') textSize = 'xs'
  if (size === 'lg') textSize = 'md'

  return (
    <Group gap={4} align="center" className={classes.voteButtons} p={6}>
      <Tooltip label="Upvote" withinPortal>
        <ActionIcon
          variant="subtle"
          color={isUpvoted ? 'orange' : 'gray'}
          size={actionIconSize}
          onClick={() => handleVote(1)}
          disabled={isVoting}
          aria-label="Upvote"
          aria-pressed={isUpvoted}
          className={classes.upvoteButton}
          data-active={isUpvoted}
        >
          <BiSolidUpvote size={iconSize} />
        </ActionIcon>
      </Tooltip>

      <Text size={textSize} fw={700} c={scoreColor} className={classes.score}>
        <NumberFormatter value={currentScore} thousandSeparator />
      </Text>

      <Tooltip label="Downvote" withinPortal>
        <ActionIcon
          variant="subtle"
          color={isDownvoted ? 'blue' : 'gray'}
          size={actionIconSize}
          onClick={() => handleVote(-1)}
          disabled={isVoting}
          aria-label="Downvote"
          aria-pressed={isDownvoted}
          className={classes.downvoteButton}
          data-active={isDownvoted}
        >
          <BiSolidDownvote size={iconSize} />
        </ActionIcon>
      </Tooltip>
    </Group>
  )
}
