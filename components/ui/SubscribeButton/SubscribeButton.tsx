'use client'

import {useSubscribe} from '@/lib/hooks/useSubscribe'
import {Button} from '@mantine/core'
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
    <Button
      onClick={toggleSubscribe}
      disabled={isPending}
      variant={isSubscribed ? 'light' : 'filled'}
      color={isSubscribed ? 'gray' : 'blue'}
      leftSection={
        isSubscribed ? <IconCheck size={16} /> : <IconPlus size={16} />
      }
      size="sm"
      aria-label={
        isSubscribed ? `Leave r/${subredditName}` : `Join r/${subredditName}`
      }
    >
      {isSubscribed ? 'Leave' : 'Join'}
    </Button>
  )
}
