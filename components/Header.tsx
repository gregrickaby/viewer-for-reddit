import {createStyles, Title} from '@mantine/core'
import {useRedditContext} from '~/components/RedditProvider'
import Settings from '~/components/Settings'
import config from '~/lib/config'

const useStyles = createStyles((theme) => ({
  header: {
    alignItems: 'center',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    textAlign: 'center',

    [`@media (min-width: ${theme.breakpoints.sm}px)`]: {
      flexDirection: 'row'
    }
  },

  title: {
    cursor: 'pointer',
    fontSize: theme.fontSizes.xl,

    [`@media (max-width: ${theme.breakpoints.sm}px)`]: {
      marginBottom: theme.spacing.md
    }
  },

  subTitle: {
    fontSize: theme.fontSizes.sm
  }
}))

/**
 * Header component.
 */
export default function Header() {
  const {classes} = useStyles()
  const {setSearchInput, setSubreddit} = useRedditContext()

  /**
   * Title click handler.
   */
  function handleClick() {
    setSearchInput('')
    setSubreddit('itookapicture')
  }

  return (
    <header className={classes.header}>
      <Title className={classes.title} onClick={handleClick} order={1}>
        {config.siteTitle}
      </Title>
      <Title className={classes.subTitle} order={2}>
        {config.siteDescription}
      </Title>
      <Settings />
    </header>
  )
}
