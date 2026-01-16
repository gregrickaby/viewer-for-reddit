'use client'

import {votePost} from '@/lib/actions/reddit'
import {getInitialVoteState} from '@/lib/utils/reddit-helpers'
import {useState, useTransition} from 'react'

/**
 * Options for configuring the useVote hook.
 */
interface UseVoteOptions {
  /** Full Reddit thing name (e.g., 't3_abc123' for post, 't1_xyz789' for comment) */
  itemName: string
  /** Initial vote state from Reddit API (true=upvoted, false=downvoted, null=no vote) */
  initialLikes: boolean | null | undefined
  /** Initial score/karma count */
  initialScore: number
}

/**
 * Return type for useVote hook.
 */
interface UseVoteReturn {
  /** Current vote state: 1 (upvoted), 0 (no vote), -1 (downvoted) */
  voteState: 1 | 0 | -1 | null
  /** Current score after optimistic updates */
  score: number
  /** Whether a vote operation is in progress */
  isPending: boolean
  /** Function to cast a vote (1 for upvote, -1 for downvote) */
  vote: (direction: 1 | -1) => void
}

/**
 * Hook for handling Reddit voting with optimistic updates.
 * Implements race condition prevention and automatic rollback on failure.
 *
 * Features:
 * - Optimistic UI updates (immediate feedback)
 * - Automatic rollback on API failure
 * - Race condition prevention (ignores clicks while pending)
 * - Toggle behavior (clicking same direction removes vote)
 *
 * @param options - Configuration for the vote hook
 * @returns Vote state, score, pending status, and vote handler
 *
 * @example
 * ```typescript
 * const {voteState, score, isPending, vote} = useVote({
 *   itemName: 't3_abc123',
 *   initialLikes: null,
 *   initialScore: 100
 * })
 *
 * // Upvote
 * <button onClick={() => vote(1)} disabled={isPending}>
 *   ↑ {score}
 * </button>
 * ```
 */
export function useVote({
  itemName,
  initialLikes,
  initialScore
}: Readonly<UseVoteOptions>): UseVoteReturn {
  const initialVote = getInitialVoteState(initialLikes)
  const [isPending, startTransition] = useTransition()
  const [voteState, setVoteState] = useState<1 | 0 | -1 | null>(initialVote)
  const [score, setScore] = useState(initialScore)

  const vote = (direction: 1 | -1) => {
    // Prevent race conditions
    if (isPending) return

    const currentVote = voteState
    const currentScore = score
    const newVote = currentVote === direction ? 0 : direction
    const scoreDiff = newVote - (currentVote || 0)

    // Optimistic update
    setVoteState(newVote)
    setScore(currentScore + scoreDiff)

    startTransition(async () => {
      const result = await votePost(itemName, newVote)
      if (!result.success) {
        // Revert on failure
        setVoteState(currentVote)
        setScore(currentScore)
      }
    })
  }

  return {
    voteState,
    score,
    isPending,
    vote
  }
}
