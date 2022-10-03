import {useLocalStorage} from '@mantine/hooks'
import {createContext, useContext} from 'react'
import config from '~/lib/config'
import {ChildrenProps} from '~/lib/types'

export interface RedditProviderProps {
  sort: string
  subReddit: any
  setSort: (sort: string) => void
  setSubreddit: (subReddit: {}) => void
}

// Create the RedditContext.
const RedditContext = createContext({} as RedditProviderProps)

// Create useRedditContext hook.
export const useRedditContext = () => useContext(RedditContext)

/**
 * RedditProvider component.
 *
 * This component is used to hold global state and provide it to child components.
 */
export default function RedditProvider({children}: ChildrenProps) {
  // Set our local storage variables.
  const [subReddit, setSubreddit] = useLocalStorage({
    key: 'riv-subreddit',
    defaultValue: config.redditApi.subReddit
  })
  const [sort, setSort] = useLocalStorage({
    key: 'riv-sort',
    defaultValue: config.redditApi.sort
  })

  // Set the global state.
  const providerValues = {
    subReddit,
    setSubreddit,
    setSort,
    sort
  }

  return (
    <RedditContext.Provider value={providerValues as RedditProviderProps}>
      {children}
    </RedditContext.Provider>
  )
}
