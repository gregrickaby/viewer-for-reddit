'use client'

import classes from '@/components/Header.module.css'
import {useRedditContext} from '@/components/RedditProvider'
import config from '@/lib/config'
import {Title} from '@mantine/core'

/**
 * Header component.
 */
export default function Header() {
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
      <Title className={classes.title} order={1} onClick={resetSearch}>
        {config.siteName}
      </Title>
      <Title className={classes.description} order={2}>
        {config.siteDescription}
      </Title>
    </header>
  )
}
