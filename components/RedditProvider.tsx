import {createContext, useContext} from 'react'
import {useUserData} from '~/lib/helpers'
import {useSession} from 'next-auth/react'
import {ChildrenProps} from '~/lib/types'

export interface RedditProviderProps {
  isError: boolean
  isLoading: boolean
  userData: {
    [key: string]: any
  }
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
  const {data: session} = useSession()
  const {userData, isLoading, isError} = useUserData(
    session?.user?.name ? true : false
  )

  const providerValues = {
    isError,
    isLoading,
    userData
  }

  return (
    <RedditContext.Provider value={providerValues as RedditProviderProps}>
      {children}
    </RedditContext.Provider>
  )
}
