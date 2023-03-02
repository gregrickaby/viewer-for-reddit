import {
  Affix,
  Button,
  createStyles,
  rem,
  Transition,
  useMantineColorScheme
} from '@mantine/core'
import {useWindowScroll} from '@mantine/hooks'
import {IconArrowUp} from '@tabler/icons-react'

const useStyles = createStyles((theme) => ({
  backToTop: {
    bottom: '12px',
    position: 'fixed',
    right: '12px',
    zIndex: 100
  }
}))

/**
 * Back To Top component.
 */
export default function BackToTop() {
  const [scroll, scrollTo] = useWindowScroll()
  const {classes} = useStyles()
  const {colorScheme} = useMantineColorScheme()

  return (
    <Affix position={{bottom: rem(20), right: rem(20)}}>
      <Transition transition="slide-up" mounted={scroll.y > 0}>
        {(transitionStyles) => (
          <Button
            leftIcon={<IconArrowUp size="1rem" />}
            style={transitionStyles}
            onClick={() => scrollTo({y: 0})}
          >
            Scroll to top
          </Button>
        )}
      </Transition>
    </Affix>
  )
}
