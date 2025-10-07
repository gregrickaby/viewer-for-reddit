import {useVoteMutation} from '@/lib/store/services/voteApi'
import type {VoteDirection} from '@/lib/types'
import {logClientError} from '@/lib/utils/logging/clientLogger'
import {notifications} from '@mantine/notifications'
import {useState} from 'react'

/**
 * Props for useVote hook
 */
export interface UseVoteProps {
  /**
   * Thing ID (fullname) - e.g., t3_abc123 for post, t1_xyz789 for comment
   */
  id: string

  /**
   * Initial vote score
   */
  initialScore: number

  /**
   * Initial vote state
   * - true: upvoted
   * - false: downvoted
   * - null/undefined: no vote
   */
  initialVote?: boolean | null
}

/**
 * Return type for useVote hook
 */
export interface UseVoteReturn {
  /**
   * Handle upvote or downvote action
   * @param direction - 1 for upvote, -1 for downvote
   */
  handleVote: (direction: 1 | -1) => Promise<void>

  /**
   * Current vote state (optimistic)
   */
  currentVote: boolean | null

  /**
   * Current score (optimistic)
   */
  currentScore: number

  /**
   * Whether a vote operation is in progress
   */
  isVoting: boolean
}

/**
 * Calculate the vote direction based on current state and user action.
 *
 * Logic:
 * - Clicking same button = unvote (direction 0)
 * - Clicking different button = new vote (direction 1 or -1)
 *
 * @param direction - User's click direction (1 for upvote, -1 for downvote)
 * @param currentVote - Current vote state (true = upvoted, false = downvoted, null = no vote)
 * @returns Vote direction to send to API (1, -1, or 0)
 */
export function calculateVoteDirection(
  direction: 1 | -1,
  currentVote: boolean | null
): VoteDirection {
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
 * Calculate the score delta for optimistic update.
 *
 * Logic:
 * - Upvoting from neutral: +1
 * - Upvoting from downvoted: +2 (remove downvote + add upvote)
 * - Downvoting from neutral: -1
 * - Downvoting from upvoted: -2 (remove upvote + add downvote)
 * - Unvoting from upvoted: -1
 * - Unvoting from downvoted: +1
 *
 * @param newDir - New vote direction (1, -1, or 0)
 * @param currentVote - Current vote state
 * @returns Score change amount
 */
export function calculateScoreDelta(
  newDir: VoteDirection,
  currentVote: boolean | null
): number {
  if (newDir === 1) {
    // Upvoting: +2 if downvoted, +1 otherwise
    return currentVote === false ? 2 : 1
  }
  if (newDir === -1) {
    // Downvoting: -2 if upvoted, -1 otherwise
    return currentVote === true ? -2 : -1
  }
  // Unvoting (newDir === 0)
  if (currentVote === true) return -1
  if (currentVote === false) return 1
  return 0
}

/**
 * Convert vote direction to boolean state.
 *
 * @param dir - Vote direction (1, -1, or 0)
 * @returns Vote state (true = upvoted, false = downvoted, null = no vote)
 */
export function voteDirectionToState(dir: VoteDirection): boolean | null {
  if (dir === 1) return true
  if (dir === -1) return false
  return null
}

/**
 * Custom hook for managing vote state and interactions.
 *
 * Handles:
 * - Vote business logic (calculations, state conversions)
 * - Optimistic updates (managed by RTK Query in voteApi)
 * - Error handling with user notifications
 * - Loading states
 *
 * The actual cache updates happen in voteApi's onQueryStarted lifecycle.
 * This hook maintains local optimistic state for immediate UI feedback,
 * which will be replaced by cache updates once the mutation completes.
 *
 * @param props - Hook configuration
 * @returns Vote state and handlers
 *
 * @example
 * const {handleVote, currentVote, currentScore, isVoting} = useVote({
 *   id: 't3_abc123',
 *   initialScore: 100,
 *   initialVote: null
 * })
 */
export function useVote({
  id,
  initialScore,
  initialVote = null
}: UseVoteProps): UseVoteReturn {
  const [vote, {isLoading}] = useVoteMutation()

  // Local state for optimistic updates
  // These provide immediate feedback while the API request is in flight
  // Once voteApi's onQueryStarted updates the cache, these become redundant
  // but they're kept for backward compatibility and instant feedback
  const [optimisticScore, setOptimisticScore] = useState(initialScore)
  const [optimisticVote, setOptimisticVote] = useState<boolean | null>(
    initialVote ?? null
  )

  /**
   * Handle vote button click.
   *
   * Flow:
   * 1. Calculate new vote direction based on current state
   * 2. Calculate score delta for optimistic update
   * 3. Update local state optimistically
   * 4. Call mutation (which triggers cache updates in voteApi)
   * 5. On error: rollback local state + show notification
   *
   * @param direction - 1 for upvote, -1 for downvote
   */
  const handleVote = async (direction: 1 | -1) => {
    const newDir = calculateVoteDirection(direction, optimisticVote)
    const scoreDelta = calculateScoreDelta(newDir, optimisticVote)

    // Store previous state for rollback
    const previousScore = optimisticScore
    const previousVote = optimisticVote

    // Optimistic update (immediate UI feedback)
    setOptimisticScore(optimisticScore + scoreDelta)
    setOptimisticVote(voteDirectionToState(newDir))

    try {
      // Call mutation - voteApi will handle cache updates via onQueryStarted
      await vote({id, dir: newDir}).unwrap()
    } catch (error: unknown) {
      // Rollback optimistic updates on error
      setOptimisticScore(previousScore)
      setOptimisticVote(previousVote)

      // Check if error is authentication-related (401 status)
      const isAuthError =
        error !== null &&
        typeof error === 'object' &&
        'status' in error &&
        (error as {status: number}).status === 401

      // Show user-friendly error notification
      notifications.show({
        title: isAuthError ? 'Sign in required' : 'Vote failed',
        message: isAuthError
          ? 'Please sign in to vote on posts and comments.'
          : 'Unable to submit vote. Please try again.',
        color: isAuthError ? 'blue' : 'red',
        autoClose: 3000
      })

      // Log error for debugging
      logClientError('Vote operation failed', error, {
        component: 'useVote',
        action: 'handleVote',
        id,
        direction,
        isAuthError
      })
    }
  }

  return {
    handleVote,
    currentVote: optimisticVote,
    currentScore: optimisticScore,
    isVoting: isLoading
  }
}
