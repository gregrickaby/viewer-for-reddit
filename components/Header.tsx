import {createStyles} from '@mantine/core'
import config from '~/lib/config'
import {useRedditContext} from './RedditProvider'

const useStyles = createStyles((theme) => ({
  header: {
    alignItems: 'center',
    display: 'flex',
    justifyContent: 'space-between',

    [`@media (max-width: ${theme.breakpoints.sm}px)`]: {
      flexDirection: 'column',
      textAlign: 'center'
    }
  },

  title: {
    fontSize: theme.fontSizes.xl,
    cursor: 'pointer',
    margin: 0,

    [`@media (max-width: ${theme.breakpoints.sm}px)`]: {
      lineHeight: 1
    }
  }
}))

/**
 * Header component.
 */
export default function Header() {
  const {classes} = useStyles()
  const {setSearchInput, setSubreddit} = useRedditContext()

  function handleClick() {
    setSearchInput('')
    setSubreddit('itookapicture')
  }

  return (
    <header className={classes.header}>
      <h1 onClick={handleClick} className={classes.title}>
        {config.siteTitle}
      </h1>
      <p>{config.siteDescription}</p>
    </header>
  )
}
