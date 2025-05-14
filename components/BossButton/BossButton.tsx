'use client'

import {Button, Tooltip, VisuallyHidden} from '@mantine/core'
import {useWindowScroll} from '@mantine/hooks'
import {useRouter} from 'next/navigation'
import {useEffect} from 'react'
import {MdExitToApp} from 'react-icons/md'
import classes from './BossButton.module.css'

export default function BossButton() {
  const router = useRouter()
  const [scroll] = useWindowScroll()
  const redirectUrl = 'https://duckduckgo.com/'
  const buttonText =
    'The boss button. Click or press Escape to instantly navigate to DuckDuckGo.'

  /**
   * Effect for handling keyboard event.
   */
  useEffect(() => {
    const keydownHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        router.push(redirectUrl)
      }
    }

    // Add the keydown event listener.
    window.addEventListener('keydown', keydownHandler)

    // Cleanup the event listener.
    return () => window.removeEventListener('keydown', keydownHandler)
  }, [router, redirectUrl])

  if (scroll.y <= 200) {
    return null
  }

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
