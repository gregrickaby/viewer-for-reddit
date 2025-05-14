'use client'

import {Button, VisuallyHidden} from '@mantine/core'
import {useWindowScroll} from '@mantine/hooks'
import {FaChevronUp} from 'react-icons/fa'
import classes from './BackToTop.module.css'

export default function BackToTop() {
  const [scroll, scrollTo] = useWindowScroll()
  const buttonText = 'Go back to the top of the page'

  if (scroll.y <= 200) {
    return null
  }

  return (
    <Button
      aria-label={buttonText}
      className={classes.backToTop}
      color="gray"
      onClick={() => scrollTo({y: 0})}
      title={buttonText}
    >
      <FaChevronUp aria-hidden="true" size={16} />
      <VisuallyHidden>{buttonText}</VisuallyHidden>
    </Button>
  )
}
