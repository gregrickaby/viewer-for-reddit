import {useLocalStorage} from '@mantine/hooks'
import {createContext, useContext, useState} from 'react'
import config from '~/lib/config'
import {ChildrenProps} from '~/lib/types'

export interface RedditProviderProps {
  blurNSFW: boolean
  searchInput: string
  setBlurNSFW: (blurNSFW: boolean) => void
  setSearchInput: (searchInput: string) => void
  setSort: (sort: string) => void
  setSubreddit: (subReddit: {}) => void
  sort: string
  subReddit: any
}

// Create the RedditContext.
const RedditContext = createContext({} as RedditProviderProps)

// Create useRedditContext hook.
export function useRedditContext() {
  return useContext(RedditContext)
}

/**
 * RedditProvider component.
 *
 * This component is used to hold global state and provide it to child components.
 */
export default function RedditProvider({children}: ChildrenProps) {
  const [sort, setSort] = useState(config.redditApi.sort)
  const [subReddit, setSubreddit] = useState(config.redditApi.subReddit)
  const [searchInput, setSearchInput] = useState('')
  const [blurNSFW, setBlurNSFW] = useLocalStorage({
    key: 'riv-nsfwblur',
    defaultValue: false,
    getInitialValueInEffect: true
  })

  // Set the global state.
  const providerValues = {
    blurNSFW,
    searchInput,
    setBlurNSFW,
    setSearchInput,
    setSort,
    setSubreddit,
    sort,
    subReddit
  }

  return (
    <RedditContext.Provider value={providerValues as RedditProviderProps}>
      {children}
    </RedditContext.Provider>
  )
}
