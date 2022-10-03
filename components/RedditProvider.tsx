import {createContext, useContext, useState} from 'react'
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
  const [sort, setSort] = useState(config.redditApi.sort)
  const [subReddit, setSubreddit] = useState(config.redditApi.subReddit)

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
