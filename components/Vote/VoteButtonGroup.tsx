'use client'

import {useVoteMutation} from '@/lib/store/services/voteApi'
import {ActionIcon, Group, NumberFormatter, Text, Tooltip} from '@mantine/core'
import {signIn, useSession} from 'next-auth/react'
import {useEffect, useMemo, useState} from 'react'
import {FaArrowDown, FaArrowUp} from 'react-icons/fa'

type VoteDirection = -1 | 0 | 1

export interface VoteButtonGroupProps {
  id: string
  score: number
  likes?: boolean | null
  size?: 'sm' | 'md'
}

const resolveInitialVote = (likes?: boolean | null): VoteDirection => {
  if (likes === true) return 1
  if (likes === false) return -1
  return 0
}

export function VoteButtonGroup({
  id,
  score,
  likes,
  size = 'md'
}: Readonly<VoteButtonGroupProps>) {
  const {data: session} = useSession()
  const [voteState, setVoteState] = useState<VoteDirection>(
    resolveInitialVote(likes)
  )
  const [displayScore, setDisplayScore] = useState(score)
  const [vote, {isLoading}] = useVoteMutation()

  useEffect(() => {
    setVoteState(resolveInitialVote(likes))
  }, [likes])

  useEffect(() => {
    setDisplayScore(score)
  }, [score])

  const isAuthenticated = useMemo(
    () => Boolean(session?.accessToken),
    [session?.accessToken]
  )

  const handleVote = (direction: VoteDirection) => {
    if (!isAuthenticated) {
      void signIn('reddit')
      return
    }

    const currentVote = voteState
    const nextVote = currentVote === direction ? 0 : direction
    if (currentVote === nextVote) return

    const previousScore = displayScore
    const delta = nextVote - currentVote

    setVoteState(nextVote)
    setDisplayScore((prev) => prev + delta)

    void vote({id, dir: nextVote})
      .unwrap()
      .catch(() => {
        setVoteState(currentVote)
        setDisplayScore(previousScore)
      })
  }

  const upvoteActive = voteState === 1
  const downvoteActive = voteState === -1
  const iconSize = size === 'sm' ? 'sm' : 'md'

  return (
    <Group gap={6} align="center">
      <Tooltip label={upvoteActive ? 'Remove upvote' : 'Upvote'} withArrow>
        <ActionIcon
          aria-label={upvoteActive ? 'Remove upvote' : 'Upvote'}
          aria-pressed={upvoteActive}
          color={upvoteActive ? 'orange' : 'gray'}
          disabled={isLoading}
          onClick={() => handleVote(1)}
          radius="xl"
          size={iconSize}
          variant={upvoteActive ? 'filled' : 'light'}
        >
          <FaArrowUp aria-hidden="true" />
        </ActionIcon>
      </Tooltip>
      <Text
        component="span"
        size={size === 'sm' ? 'xs' : 'sm'}
        c="dimmed"
        aria-live="polite"
      >
        <NumberFormatter value={displayScore} thousandSeparator />
      </Text>
      <Tooltip
        label={downvoteActive ? 'Remove downvote' : 'Downvote'}
        withArrow
      >
        <ActionIcon
          aria-label={downvoteActive ? 'Remove downvote' : 'Downvote'}
          aria-pressed={downvoteActive}
          color={downvoteActive ? 'blue' : 'gray'}
          disabled={isLoading}
          onClick={() => handleVote(-1)}
          radius="xl"
          size={iconSize}
          variant={downvoteActive ? 'filled' : 'light'}
        >
          <FaArrowDown aria-hidden="true" />
        </ActionIcon>
      </Tooltip>
    </Group>
  )
}
