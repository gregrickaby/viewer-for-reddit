'use client'

import {Affix, Button, rem, Transition} from '@mantine/core'
import {useWindowScroll} from '@mantine/hooks'
import {IconArrowUp} from '@tabler/icons-react'
import classes from '~/components/BackToTop.module.css'

/**
 * Back To Top component.
 */
export default function BackToTop() {
  const [scroll, scrollTo] = useWindowScroll()

  return (
    <div className={classes.backtotop}>
      <Affix position={{bottom: rem(20), right: rem(20)}}>
        <Transition transition="slide-up" mounted={scroll.y > 0}>
          {(transitionStyles) => (
            <Button
              aria-label="scroll to top"
              leftSection={<IconArrowUp size="1rem" />}
              style={transitionStyles}
              onClick={() => scrollTo({y: 0})}
            >
              Scroll to top
            </Button>
          )}
        </Transition>
      </Affix>
    </div>
  )
}
