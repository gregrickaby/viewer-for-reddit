'use client'

import {toggleSubscription} from '@/lib/actions/reddit'
import {logger} from '@/lib/axiom/client'
import {useOptimistic, useState, useTransition} from 'react'

interface UseSubscribeOptions {
  subredditName: string
  initialIsSubscribed: boolean
}

/**
 * Hook for managing subreddit subscription state with optimistic updates.
 * Handles subscribe/unsubscribe actions with automatic rollback on failure.
 *
 * @param options - Configuration object
 * @param options.subredditName - Name of the subreddit (without 'r/' prefix)
 * @param options.initialIsSubscribed - Initial subscription state
 * @returns Object containing subscription state and toggle function
 *
 * @example
 * ```typescript
 * const {isSubscribed, isPending, toggleSubscribe} = useSubscribe({
 *   subredditName: 'ProgrammerHumor',
 *   initialIsSubscribed: false
 * })
 *
 * <Button onClick={toggleSubscribe} disabled={isPending}>
 *   {isSubscribed ? 'Leave' : 'Join'}
 * </Button>
 * ```
 */
export function useSubscribe({
  subredditName,
  initialIsSubscribed
}: Readonly<UseSubscribeOptions>) {
  const [isSubscribed, setIsSubscribed] = useState(initialIsSubscribed)
  const [optimisticIsSubscribed, setOptimisticIsSubscribed] =
    useOptimistic(isSubscribed)
  const [isPending, startTransition] = useTransition()

  const toggleSubscribe = () => {
    if (isPending) return

    const newState = !isSubscribed
    const action = isSubscribed ? 'unsub' : 'sub'

    startTransition(async () => {
      setOptimisticIsSubscribed(newState)
      const result = await toggleSubscription(subredditName, action)

      if (result.success) {
        setIsSubscribed(newState)
      } else {
        logger.error('Failed to toggle subscription', {
          error: result.error,
          context: 'useSubscribe',
          subredditName,
          action
        })
      }
    })
  }

  return {
    isSubscribed: optimisticIsSubscribed,
    isPending,
    toggleSubscribe
  }
}
