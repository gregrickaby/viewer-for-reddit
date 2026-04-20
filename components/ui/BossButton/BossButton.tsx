'use client'

import {useBossButton} from '@/lib/hooks/useBossButton'
import {Button, Tooltip, VisuallyHidden} from '@mantine/core'
import {IconDoorExit} from '@tabler/icons-react'
import classes from './BossButton.module.css'

/** "Boss Button" for quickly navigating away from Reddit when needed. */
export default function BossButton() {
  const {shouldShow, redirectUrl, buttonText} = useBossButton(
    'https://duckduckgo.com/'
  )

  if (!shouldShow) return null

  return (
    <Tooltip label={buttonText} position="left" withArrow>
      <Button
        aria-label={buttonText}
        className={classes.bossButton}
        color="gray"
        component="a"
        href={redirectUrl}
        data-umami-event="boss-button"
      >
        <IconDoorExit aria-hidden="true" size={24} />
        <VisuallyHidden>{buttonText}</VisuallyHidden>
      </Button>
    </Tooltip>
  )
}
