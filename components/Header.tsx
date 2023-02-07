import {createStyles, Title} from '@mantine/core'
import {useRedditContext} from '~/components/RedditProvider'
import Settings from '~/components/Settings'
import config from '~/lib/config'

const useStyles = createStyles((theme) => ({
  header: {
    alignItems: 'center',
    display: 'flex',
    justifyContent: 'center',

    '@media (min-width: 770px)': {
      justifyContent: 'space-between'
    }
  },

  titleWrap: {
    alignItems: 'center',
    display: 'flex',
    gap: theme.spacing.lg,
    flexDirection: 'column',
    justifyContent: 'space-between',
    textAlign: 'center',

    '@media (min-width: 770px)': {
      flexDirection: 'row'
    }
  },

  title: {
    cursor: 'pointer',
    flex: '0 0 1',
    fontSize: theme.fontSizes.xl,

    [`@media (max-width: ${theme.breakpoints.sm}px)`]: {
      marginBottom: theme.spacing.md
    }
  },

  subTitle: {
    flex: '1',
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
      <div className={classes.titleWrap}>
        <Title className={classes.title} onClick={handleClick} order={1}>
          {config.siteTitle}
        </Title>
        <Title className={classes.subTitle} order={2}>
          {config.siteDescription}
        </Title>
      </div>
      <Settings />
    </header>
  )
}
