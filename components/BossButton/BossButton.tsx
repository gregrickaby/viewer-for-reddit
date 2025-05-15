'use client'

import {useBossButton} from '@/lib/hooks/useBossButton'
import {Button, Tooltip, VisuallyHidden} from '@mantine/core'
import {MdExitToApp} from 'react-icons/md'
import classes from './BossButton.module.css'

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
      >
        <MdExitToApp aria-hidden="true" size={24} />
        <VisuallyHidden>{buttonText}</VisuallyHidden>
      </Button>
    </Tooltip>
  )
}
