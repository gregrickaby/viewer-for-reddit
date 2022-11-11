import {ActionIcon, createStyles, useMantineColorScheme} from '@mantine/core'
import {useWindowScroll} from '@mantine/hooks'
import {IconArrowUp} from '@tabler/icons'

const useStyles = createStyles((theme) => ({
  backToTop: {
    bottom: '24px',
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
  const {colorScheme} = useMantineColorScheme()

  // Only show the button if the user has scrolled down 100px.
  if (scroll.y < 100) {
    return <></>
  }

  return (
    <ActionIcon
      aria-label="Scroll to top"
      className={classes.backToTop}
      color={colorScheme === 'dark' ? 'gray' : 'dark'}
      variant="filled"
      onClick={() => scrollTo({y: 0})}
      tabIndex={0}
      size="xl"
    >
      <IconArrowUp />
    </ActionIcon>
  )
}
