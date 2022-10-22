import {Button, createStyles} from '@mantine/core'
import {useWindowScroll} from '@mantine/hooks'
import {IconArrowUp} from '@tabler/icons'

const useStyles = createStyles((theme) => ({
  backToTop: {
    bottom: '24px',
    paddingRight: 0,
    position: 'fixed',
    right: '24px',
    zIndex: 100
  }
}))

/**
 * Back To Top component.
 */
export default function BackToTop() {
  const [scroll, scrollTo] = useWindowScroll()
  const {classes} = useStyles()

  // Only show the button if the user has scrolled down 100px.
  if (scroll.y < 100) {
    return <></>
  }

  return (
    <Button
      aria-label="Scroll to top"
      className={classes.backToTop}
      leftIcon={<IconArrowUp />}
      onClick={() => scrollTo({y: 0})}
      tabIndex={0}
    />
  )
}
