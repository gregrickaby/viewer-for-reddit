'use client'

import config from '@/lib/config'
import {ChildrenProps, RedditProviderProps} from '@/lib/types'
import {useLocalStorage} from '@mantine/hooks'
import {createContext, useContext, useState} from 'react'

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
  const [autoPlay, setAutoplay] = useLocalStorage({
    key: 'vfr-autoplay',
    defaultValue: true,
    getInitialValueInEffect: true
  })
  const [blurNSFW, setBlurNSFW] = useLocalStorage({
    key: 'vfr-nsfwblur',
    defaultValue: false,
    getInitialValueInEffect: true
  })

  // Set the global state.
  const providerValues = {
    autoPlay,
    blurNSFW,
    searchInput,
    setAutoplay,
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
