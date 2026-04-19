'use client'

import {toggleSubscription} from '@/lib/actions/reddit/subreddits'
import {logger} from '@/lib/axiom/client'
import {useOptimisticToggle} from './primitives/useOptimisticToggle'

interface UseSubscribeOptions {
  subredditName: string
  initialIsSubscribed: boolean
}

interface UseSubscribeReturn {
  isSubscribed: boolean
  isPending: boolean
  toggleSubscribe: () => void
}

/**
 * Toggles subreddit subscription state with optimistic updates.
 *
 * @param options.subredditName - The subreddit name (without `r/`).
 * @param options.initialIsSubscribed - Current subscription state.
 * @returns `isSubscribed`, `isPending`, and `toggleSubscribe`.
 */
export function useSubscribe({
  subredditName,
  initialIsSubscribed
}: Readonly<UseSubscribeOptions>): UseSubscribeReturn {
  const {
    value: isSubscribed,
    isPending,
    toggle: toggleSubscribe
  } = useOptimisticToggle(initialIsSubscribed, async (next) => {
    const action = next ? 'sub' : 'unsub'
    const result = await toggleSubscription(subredditName, action)
    if (!result.success) {
      logger.error('Failed to toggle subscription', {
        error: result.error,
        context: 'useSubscribe',
        subredditName,
        action
      })
    }
    return result
  })

  return {isSubscribed, isPending, toggleSubscribe}
}
