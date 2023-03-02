import {createStyles, Title} from '@mantine/core'
import {useRedditContext} from '~/components/RedditProvider'
import config from '~/lib/config'

const useStyles = createStyles((theme) => ({
  header: {
    alignItems: 'center',
    display: 'flex',
    justifyContent: 'center'
  },

  title: {
    cursor: 'pointer'
  },

  subTitle: {
    border: 0,
    clip: 'rect(0, 0, 0, 0)',
    height: '1px',
    margin: '-1px',
    overflow: 'hidden',
    padding: 0,
    position: 'absolute',
    whiteSpace: 'nowrap',
    width: '1px'
  }
}))

/**
 * Header component.
 */
export default function Header() {
  const {classes} = useStyles()
  const {setSearchInput, setSubreddit} = useRedditContext()

  /**
   * Reset the search input and subreddit.
   */
  function resetSearch() {
    setSearchInput(config?.redditApi?.subReddit)
    setSubreddit(config?.redditApi?.subReddit)
  }

  return (
    <header className={classes.header}>
      <Title className={classes.title} onClick={resetSearch} order={1}>
        {config.siteTitle}
      </Title>
      <Title className={classes.subTitle} order={2}>
        {config.siteDescription}
      </Title>
    </header>
  )
}
