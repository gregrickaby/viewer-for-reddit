'use client'

import {SCROLL_THRESHOLD} from '@/lib/utils/constants'
import {Button, VisuallyHidden} from '@mantine/core'
import {useWindowScroll} from '@mantine/hooks'
import {IconChevronUp} from '@tabler/icons-react'
import classes from './BackToTop.module.css'

/**
 * "Back to Top" button that appears when scrolling down.
 * Provides quick navigation back to the top of the page.
 *
 * Features:
 * - Auto-shows after scrolling past 100px
 * - Smooth scroll to top on click
 * - Accessible with ARIA labels and VisuallyHidden text
 * - Fixed positioning in bottom-right corner
 *
 * @example
 * ```typescript
 * <BackToTop />
 * ```
 */
export default function BackToTop() {
  const [scroll, scrollTo] = useWindowScroll()
  const buttonText = 'Go back to the top of the page'

  if (scroll.y <= SCROLL_THRESHOLD) {
    return null
  }

  return (
    <Button
      aria-label={buttonText}
      className={classes.backToTop}
      color="gray"
      onClick={() => scrollTo({y: 0})}
      title={buttonText}
      data-umami-event="back-to-top"
    >
      <IconChevronUp aria-hidden="true" size={16} />
      <VisuallyHidden>{buttonText}</VisuallyHidden>
    </Button>
  )
}
