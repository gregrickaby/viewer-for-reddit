'use client'

import {useSubscribe} from '@/lib/hooks/useSubscribe'
import {Button} from '@mantine/core'
import {IconCheck, IconPlus} from '@tabler/icons-react'

interface SubscribeButtonProps {
  subredditName: string
  initialIsSubscribed: boolean
}

/**
 * Button component for subscribing/unsubscribing to a subreddit.
 * Uses optimistic updates with automatic rollback on failure.
 *
 * @param subredditName - Name of the subreddit (without 'r/' prefix)
 * @param initialIsSubscribed - Initial subscription state from server
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
