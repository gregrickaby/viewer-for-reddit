'use client'

import {createContext, useCallback, useContext, useMemo, useState} from 'react'

/**
 * Represents a navigable post in the feed.
 */
interface NavigablePost {
  /** Reddit post ID (e.g., 't3_abc123') */
  id: string
  /** Full URL path to the post */
  url: string
  /** Post title for debugging */
  title: string
}

/**
 * Post navigation context value.
 */
interface PostNavigationContextValue {
  /** Array of posts from the current feed */
  posts: NavigablePost[]
  /** ID of the currently viewed post */
  currentPostId: string | null
  /** Register a list of posts from a feed */
  setPosts: (posts: NavigablePost[]) => void
  /** Set the currently viewed post */
  setCurrentPostId: (postId: string | null) => void
  /** Get the next post in the feed (if available) */
  getNextPost: () => NavigablePost | null
  /** Get the previous post in the feed (if available) */
  getPreviousPost: () => NavigablePost | null
}

const PostNavigationContext = createContext<
  PostNavigationContextValue | undefined
>(undefined)

/**
 * PostNavigationProvider - tracks post list context for swipe navigation.
 *
 * Enables swipe-left-to-next-post and swipe-right-to-previous-post gestures
 * by maintaining the current feed's post list and tracking the active post.
 *
 * Features:
 * - Tracks post list from feeds (subreddit, search, user profile)
 * - Finds next/previous posts based on current position
 * - Resets when navigating to different feeds
 * - Works with infinite scroll (updates as more posts load)
 *
 * @param children - Child components
 *
 * @example
 * ```typescript
 * <PostNavigationProvider>
 *   <App />
 * </PostNavigationProvider>
 * ```
 */
export function PostNavigationProvider({
  children
}: Readonly<{children: React.ReactNode}>) {
  const [posts, setPostsState] = useState<NavigablePost[]>([])
  const [currentPostId, setCurrentPostIdState] = useState<string | null>(null)

  const setPosts = useCallback((newPosts: NavigablePost[]) => {
    setPostsState(newPosts)
  }, [])

  const setCurrentPostId = useCallback((postId: string | null) => {
    setCurrentPostIdState(postId)
  }, [])

  const getNextPost = useCallback((): NavigablePost | null => {
    if (!currentPostId || posts.length === 0) {
      return null
    }

    const currentIndex = posts.findIndex((post) => post.id === currentPostId)
    if (currentIndex === -1 || currentIndex === posts.length - 1) {
      return null
    }

    return posts[currentIndex + 1]
  }, [posts, currentPostId])

  const getPreviousPost = useCallback((): NavigablePost | null => {
    if (!currentPostId || posts.length === 0) {
      return null
    }

    const currentIndex = posts.findIndex((post) => post.id === currentPostId)
    if (currentIndex <= 0) {
      return null
    }

    return posts[currentIndex - 1]
  }, [posts, currentPostId])

  const value = useMemo(
    () => ({
      posts,
      currentPostId,
      setPosts,
      setCurrentPostId,
      getNextPost,
      getPreviousPost
    }),
    [
      posts,
      currentPostId,
      setPosts,
      setCurrentPostId,
      getNextPost,
      getPreviousPost
    ]
  )

  return (
    <PostNavigationContext.Provider value={value}>
      {children}
    </PostNavigationContext.Provider>
  )
}

/**
 * Hook to access post navigation context.
 *
 * @throws Error if used outside PostNavigationProvider
 *
 * @example
 * ```typescript
 * const { getNextPost, setCurrentPostId } = usePostNavigation()
 * ```
 */
export function usePostNavigation() {
  const context = useContext(PostNavigationContext)
  if (!context) {
    throw new Error(
      'usePostNavigation must be used within PostNavigationProvider'
    )
  }
  return context
}
