'use client'

import {toggleSubscription} from '@/lib/actions/reddit'
import {logger} from '@/lib/utils/logger'
import {useState, useTransition} from 'react'

export interface ManagedSubscription {
  name: string
  displayName: string
  icon?: string
}

interface UseSubredditManagerOptions {
  initialSubscriptions: ManagedSubscription[]
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
  const [subscriptions, setSubscriptions] =
    useState<ManagedSubscription[]>(initialSubscriptions)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const clearError = () => setError(null)

  const isSubscribed = (name: string) =>
    subscriptions.some((s) => s.name.toLowerCase() === name.toLowerCase())

  const join = (sub: ManagedSubscription) => {
    if (isPending) return
    setError(null)

    // Optimistic update
    setSubscriptions((prev) => [...prev, sub])

    startTransition(async () => {
      const result = await toggleSubscription(sub.name, 'sub')
      if (!result.success) {
        // Rollback
        setSubscriptions((prev) => prev.filter((s) => s.name !== sub.name))
        const msg = result.error ?? 'Failed to join subreddit'
        setError(msg)
        logger.error('Failed to join subreddit', msg, {
          context: 'useSubredditManager',
          subredditName: sub.name
        })
      }
    })
  }

  const leave = (name: string) => {
    if (isPending) return
    setError(null)

    const snapshot = [...subscriptions]
    setSubscriptions((prev) => prev.filter((s) => s.name !== name))

    startTransition(async () => {
      const result = await toggleSubscription(name, 'unsub')
      if (!result.success) {
        setSubscriptions(snapshot)
        const msg = result.error ?? 'Failed to leave subreddit'
        setError(msg)
        logger.error('Failed to leave subreddit', msg, {
          context: 'useSubredditManager',
          subredditName: name
        })
      }
    })
  }

  return {
    subscriptions,
    error,
    isPending,
    clearError,
    isSubscribed,
    join,
    leave
  }
}
