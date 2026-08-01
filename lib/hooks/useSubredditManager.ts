'use client'

import {toggleSubscription} from '@/lib/actions/reddit/subreddits'
import {logger} from '@/lib/datadog/client'
import {useState} from 'react'
import {useOptimisticMutation} from './primitives/useOptimisticMutation'

export interface ManagedSubscription {
  name: string
  displayName: string
  icon?: string
}

interface UseSubredditManagerOptions {
  initialSubscriptions: ManagedSubscription[]
}

type SubscriptionAction =
  {type: 'join'; sub: ManagedSubscription} | {type: 'leave'; name: string}

function computeNextSubscriptions(
  committed: ManagedSubscription[],
  action: SubscriptionAction
): ManagedSubscription[] {
  return action.type === 'join'
    ? [...committed, action.sub]
    : committed.filter((s) => s.name !== action.name)
}

/**
 * Hook for managing subreddit subscriptions with optimistic updates.
 * Handles join/leave with automatic rollback on failure.
 *
 * @param options.initialSubscriptions - Initial subscriptions list from server
 * @returns Subscriptions state, pending status, error, and mutation functions
 *
 * @example
 * ```typescript
 * const {subscriptions, isPending, error, join, leave, isSubscribed} = useSubredditManager({
 *   initialSubscriptions: fetchedSubscriptions
 * })
 * ```
 */
export function useSubredditManager({
  initialSubscriptions
}: Readonly<UseSubredditManagerOptions>) {
  const [error, setError] = useState<string | null>(null)

  const {
    state: subscriptions,
    isPending,
    mutate
  } = useOptimisticMutation<ManagedSubscription[], SubscriptionAction>(
    initialSubscriptions,
    computeNextSubscriptions,
    async (_next, action) => {
      setError(null)

      if (action.type === 'join') {
        const result = await toggleSubscription(action.sub.name, 'sub')
        if (!result.success) {
          const msg = result.error ?? 'Failed to join subreddit'
          setError(msg)
          logger.error('Failed to join subreddit', {
            error: msg,
            context: 'useSubredditManager',
            subredditName: action.sub.name
          })
        }
        return {success: result.success}
      }

      const result = await toggleSubscription(action.name, 'unsub')
      if (!result.success) {
        const msg = result.error ?? 'Failed to leave subreddit'
        setError(msg)
        logger.error('Failed to leave subreddit', {
          error: msg,
          context: 'useSubredditManager',
          subredditName: action.name
        })
      }
      return {success: result.success}
    }
  )

  const isSubscribed = (name: string) =>
    subscriptions.some((s) => s.name.toLowerCase() === name.toLowerCase())

  return {
    subscriptions,
    error,
    isPending,
    clearError: () => setError(null),
    isSubscribed,
    join: (sub: ManagedSubscription) => mutate({type: 'join', sub}),
    leave: (name: string) => mutate({type: 'leave', name})
  }
}
