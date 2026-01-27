'use client'

import {useBossButton} from '@/lib/hooks'
import {Button, Tooltip, VisuallyHidden} from '@mantine/core'
import {IconDoorExit} from '@tabler/icons-react'
import classes from './BossButton.module.css'

/**
 * "Boss Button" for quickly navigating away from Reddit.
 * Useful for hiding content when needed (e.g., at work).
 *
 * Features:
 * - Auto-shows after scrolling past 200px
 * - Click to navigate to DuckDuckGo
 * - Press Escape key to navigate (handled by useBossButton hook)
 * - Tooltip with description
 * - Fixed positioning in bottom-left corner
 *
 * @example
 * ```typescript
 * <BossButton />
 * ```
 */
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
