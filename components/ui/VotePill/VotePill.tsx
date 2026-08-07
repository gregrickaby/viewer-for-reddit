'use client'

import {formatNumber} from '@/lib/utils/formatters'
import {getVoteColor} from '@/lib/utils/reddit-helpers'
import {Group, Paper, Text, UnstyledButton} from '@mantine/core'
import {IconArrowDown, IconArrowUp} from '@tabler/icons-react'

/**
 * Props for the VotePill component.
 */
interface VotePillProps {
  /** Current vote state: 1 (upvoted), 0 (no vote), -1 (downvoted) */
  voteState: 1 | 0 | -1 | null
  /** Current score/karma count */
  score: number
  /** Whether a vote is in progress */
  isPending: boolean
  /** Vote handler function */
  onVote: (direction: 1 | -1) => void
  /** Accessible name for the upvote button */
  upvoteLabel: string
  /** Accessible name for the downvote button */
  downvoteLabel: string
}

/**
 * Shared upvote/score/downvote pill, used by both posts and comments so
 * vote controls look identical everywhere they appear.
 */
export function VotePill({
  voteState,
  score,
  isPending,
  onVote,
  upvoteLabel,
  downvoteLabel
}: Readonly<VotePillProps>) {
  return (
    <Paper radius="xl" bg="var(--mantine-color-default)" px={8} py={4}>
      <Group gap={6} wrap="nowrap">
        <UnstyledButton
          onClick={() => onVote(1)}
          disabled={isPending}
          aria-label={upvoteLabel}
          style={{display: 'flex'}}
        >
          <IconArrowUp
            aria-hidden="true"
            size={16}
            color={
              voteState === 1
                ? 'var(--mantine-color-orange-6)'
                : 'var(--mantine-color-dimmed)'
            }
          />
        </UnstyledButton>
        <Text size="sm" fw={600} c={getVoteColor(voteState)}>
          {formatNumber(score)}
        </Text>
        <UnstyledButton
          onClick={() => onVote(-1)}
          disabled={isPending}
          aria-label={downvoteLabel}
          style={{display: 'flex'}}
        >
          <IconArrowDown
            aria-hidden="true"
            size={16}
            color={
              voteState === -1
                ? 'var(--mantine-color-blue-6)'
                : 'var(--mantine-color-dimmed)'
            }
          />
        </UnstyledButton>
      </Group>
    </Paper>
  )
}
