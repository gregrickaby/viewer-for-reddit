'use client'

import {votePost} from '@/lib/actions/reddit/users'
import {getInitialVoteState} from '@/lib/utils/reddit-helpers'
import {useOptimisticMutation} from './primitives/useOptimisticMutation'

interface UseVoteOptions {
  itemName: string
  initialLikes: boolean | null | undefined
  initialScore: number
}

interface UseVoteReturn {
  voteState: 1 | 0 | -1 | null
  score: number
  isPending: boolean
  vote: (direction: 1 | -1) => void
}

interface VoteData {
  voteState: 1 | 0 | -1 | null
  score: number
}

/**
 * Derives the next vote state and score from the current committed state and
 * the direction clicked. Clicking the same direction twice removes the vote.
 *
 * @param committed - Current committed vote data.
 * @param direction - The vote direction clicked (1 = up, -1 = down).
 * @returns Next vote data.
 */
function computeNextVoteState(
  committed: VoteData,
  direction: 1 | -1
): VoteData {
  const newVote = committed.voteState === direction ? 0 : direction
  const newScore = committed.score + newVote - (committed.voteState ?? 0)
  return {voteState: newVote, score: newScore}
}

/**
 * Manages optimistic vote state for a Reddit post or comment.
 *
 * @param options.itemName - The item fullname (e.g. `t3_abc123`).
 * @param options.initialLikes - Reddit's likes value (true/false/null).
 * @param options.initialScore - The current score.
 * @returns `voteState`, `score`, `isPending`, and `vote`.
 */
export function useVote({
  itemName,
  initialLikes,
  initialScore
}: Readonly<UseVoteOptions>): UseVoteReturn {
  const {
    state,
    isPending,
    mutate: vote
  } = useOptimisticMutation(
    {voteState: getInitialVoteState(initialLikes), score: initialScore},
    computeNextVoteState,
    (next, _dir) => votePost(itemName, next.voteState ?? 0)
  )

  return {...state, isPending, vote}
}
