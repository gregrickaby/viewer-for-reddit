'use client'

import {
  useGetUserCommentsInfiniteQuery,
  useGetUserPostsInfiniteQuery,
  useGetUserProfileQuery
} from '@/lib/store/services/redditApi'
import {Center, Loader, Text} from '@mantine/core'
import classes from './UserProfile.module.css'

interface UserProfileProps {
  username: string
}

/**
 * Client component that fetches and displays user profile data.
 */
export function UserProfile({username}: Readonly<UserProfileProps>) {
  // Fetch user profile data
  const {
    data: profile,
    isLoading: profileLoading,
    error: profileError
  } = useGetUserProfileQuery(username)

  // Fetch user posts
  const {
    data: posts,
    isLoading: postsLoading,
    error: postsError
  } = useGetUserPostsInfiniteQuery(username)

  // Fetch user comments
  const {
    data: comments,
    isLoading: commentsLoading,
    error: commentsError
  } = useGetUserCommentsInfiniteQuery(username)

  // Combine all data for display
  const userData = {
    profile: {
      data: profile,
      loading: profileLoading,
      error: profileError
    },
    posts: {
      data: posts,
      loading: postsLoading,
      error: postsError
    },
    comments: {
      data: comments,
      loading: commentsLoading,
      error: commentsError
    }
  }

  if (profileLoading || postsLoading || commentsLoading) {
    return (
      <Center>
        <Loader />
      </Center>
    )
  }

  if (profileError || postsError || commentsError) {
    return <Text c="red">Error loading user data.</Text>
  }

  return (
    <div className={classes.container}>
      <h1 className={classes.header}>User Profile: u/{username}</h1>
      <pre className={classes.data}>{JSON.stringify(userData, null, 2)}</pre>
    </div>
  )
}
