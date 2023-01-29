'use client'
import {ChildrenProps, Posts} from '@/lib/types'
import {createContext, useContext, useState} from 'react'

export interface RedditProviderProps {
  posts: Posts
  setPosts: (data: any) => void
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
export default function RedditProvider({
  children,
  posts
}: ChildrenProps & {posts: any}) {
  const [sort, setSort] = useState('hot')
  const [subReddit, setSubreddit] = useState('itookapicture')
  const [searchInput, setSearchInput] = useState('')
  const [blurNSFW, setBlurNSFW] = useState(true)
  const [setPosts] = useState(posts)

  // Set the global state.
  const providerValues = {
    posts,
    setPosts,
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
