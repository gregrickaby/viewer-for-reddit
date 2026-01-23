'use client'

import {toggleSubscription} from '@/lib/actions/reddit'
import {logger} from '@/lib/utils/logger'
import {useState, useTransition} from 'react'

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
  const [isPending, startTransition] = useTransition()

  const toggleSubscribe = () => {
    // Prevent race conditions - ignore clicks while pending
    if (isPending) return

    // Store current state for rollback
    const previousState = isSubscribed

    // Optimistic update - toggle immediately
    setIsSubscribed(!isSubscribed)

    // Perform server action
    startTransition(async () => {
      const action = isSubscribed ? 'unsub' : 'sub'
      const result = await toggleSubscription(subredditName, action)

      // Rollback on failure
      if (!result.success) {
        setIsSubscribed(previousState)
        logger.error('Failed to toggle subscription', result.error, {
          context: 'useSubscribe',
          subredditName,
          action
        })
      }
    })
  }

  return {
    isSubscribed,
    isPending,
    toggleSubscribe
  }
}
