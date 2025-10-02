'use client'

import {useVoteMutation} from '@/lib/store/services/voteApi'
import type {VoteDirection} from '@/lib/types'
import {ActionIcon, NumberFormatter, Stack, Text, Tooltip} from '@mantine/core'
import {notifications} from '@mantine/notifications'
import {useState} from 'react'
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
 * - Optimistic UI updates
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
  const [vote, {isLoading}] = useVoteMutation()

  // Local state for optimistic updates
  const [optimisticScore, setOptimisticScore] = useState(score)
  const [optimisticVote, setOptimisticVote] = useState<boolean | null>(
    userVote ?? null
  )

  // Calculate icon size based on button size
  let iconSize = 20
  if (size === 'sm') iconSize = 16
  if (size === 'lg') iconSize = 24

  /**
   * Calculate new vote direction based on current state
   */
  const calculateVoteDirection = (
    direction: 1 | -1,
    currentVote: boolean | null
  ): VoteDirection => {
    // If clicking the same button, unvote (dir = 0)
    if (
      (direction === 1 && currentVote === true) ||
      (direction === -1 && currentVote === false)
    ) {
      return 0
    }
    return direction
  }

  /**
   * Calculate score change for optimistic update
   */
  const calculateScoreDelta = (
    newDir: VoteDirection,
    currentVote: boolean | null
  ): number => {
    if (newDir === 1) {
      // Upvoting: +2 if downvoted, +1 otherwise
      return currentVote === false ? 2 : 1
    }
    if (newDir === -1) {
      // Downvoting: -2 if upvoted, -1 otherwise
      return currentVote === true ? -2 : -1
    }
    // Unvoting
    if (currentVote === true) return -1
    if (currentVote === false) return 1
    return 0
  }

  /**
   * Convert vote direction to boolean state
   */
  const voteDirectionToState = (dir: VoteDirection): boolean | null => {
    if (dir === 1) return true
    if (dir === -1) return false
    return null
  }

  /**
   * Handle vote button click
   */
  const handleVote = async (direction: 1 | -1) => {
    const newDir = calculateVoteDirection(direction, optimisticVote)
    const scoreDelta = calculateScoreDelta(newDir, optimisticVote)

    // Store previous state for rollback
    const previousScore = optimisticScore
    const previousVote = optimisticVote

    // Optimistic update
    setOptimisticScore(optimisticScore + scoreDelta)
    setOptimisticVote(voteDirectionToState(newDir))

    try {
      await vote({id, dir: newDir}).unwrap()
    } catch (error) {
      // Rollback on error
      setOptimisticScore(previousScore)
      setOptimisticVote(previousVote)

      notifications.show({
        title: 'Vote failed',
        message: 'Unable to submit vote. Please try again.',
        color: 'red',
        autoClose: 3000
      })

      console.error('Vote error:', error)
    }
  }

  const isUpvoted = optimisticVote === true
  const isDownvoted = optimisticVote === false

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
    <Stack gap={4} align="center" className={classes.voteButtons}>
      <Tooltip label="Upvote" withinPortal>
        <ActionIcon
          variant="subtle"
          color={isUpvoted ? 'orange' : 'gray'}
          size={actionIconSize}
          onClick={() => handleVote(1)}
          disabled={isLoading}
          aria-label="Upvote"
          aria-pressed={isUpvoted}
          className={classes.upvoteButton}
          data-active={isUpvoted}
        >
          <BiSolidUpvote size={iconSize} />
        </ActionIcon>
      </Tooltip>

      <Text size={textSize} fw={700} c={scoreColor} className={classes.score}>
        <NumberFormatter value={optimisticScore} thousandSeparator />
      </Text>

      <Tooltip label="Downvote" withinPortal>
        <ActionIcon
          variant="subtle"
          color={isDownvoted ? 'blue' : 'gray'}
          size={actionIconSize}
          onClick={() => handleVote(-1)}
          disabled={isLoading}
          aria-label="Downvote"
          aria-pressed={isDownvoted}
          className={classes.downvoteButton}
          data-active={isDownvoted}
        >
          <BiSolidDownvote size={iconSize} />
        </ActionIcon>
      </Tooltip>
    </Stack>
  )
}
