'use client'

import {ToggleButton} from '@/components/ui/ToggleButton/ToggleButton'
import {useSubscribe} from '@/lib/hooks/useSubscribe'
import {IconCheck, IconPlus} from '@tabler/icons-react'

interface SubscribeButtonProps {
  /** Name of the subreddit (without the r/ prefix) */
  subredditName: string
  /** Initial subscription state from the server */
  initialIsSubscribed: boolean
}

/**
 * Button for subscribing or unsubscribing to a subreddit.
 * Uses optimistic updates with automatic rollback on failure.
 */
export function SubscribeButton({
  subredditName,
  initialIsSubscribed
}: Readonly<SubscribeButtonProps>) {
  const {isSubscribed, isPending, toggleSubscribe} = useSubscribe({
    subredditName,
    initialIsSubscribed
  })

  return (
    <ToggleButton
      active={isSubscribed}
      isPending={isPending}
      onToggle={toggleSubscribe}
      activeLabel="Leave"
      inactiveLabel="Join"
      activeIcon={<IconCheck size={16} />}
      inactiveIcon={<IconPlus size={16} />}
      activeAriaLabel={`Leave r/${subredditName}`}
      inactiveAriaLabel={`Join r/${subredditName}`}
    />
  )
}
