'use client'

import {usePostNavigation} from '@/lib/contexts/PostNavigationContext'
import type {RedditPost} from '@/lib/types/reddit'
import {extractSlug} from '@/lib/utils/reddit-helpers'
import {useEffect} from 'react'

/**
 * Props for PostListTracker component.
 */
interface PostListTrackerProps {
  /** Array of posts to track for navigation */
  posts: RedditPost[]
}

/**
 * PostListTracker - registers post list with PostNavigationContext.
 *
 * This client component converts RedditPost objects to NavigablePost format
 * and registers them with the context, enabling swipe navigation between posts.
 *
 * Must be used within PostNavigationProvider.
 *
 * @param posts - Array of Reddit posts from the feed
 *
 * @example
 * ```typescript
 * <PostListTracker posts={posts} />
 * <PostListWithTabs posts={posts} />
 * ```
 */
export function PostListTracker({posts}: Readonly<PostListTrackerProps>) {
  const {setPosts} = usePostNavigation()

  useEffect(() => {
    // Convert RedditPost to NavigablePost format
    const navigablePosts = posts.map((post) => {
      const slug = extractSlug(post.permalink, post.id)
      return {
        id: post.name,
        url: `/r/${post.subreddit}/comments/${post.id}/${slug}`,
        title: post.title
      }
    })

    setPosts(navigablePosts)

    // Clear posts when component unmounts (navigating away from feed)
    return () => {
      setPosts([])
    }
  }, [posts, setPosts])

  // This component has no visual output
  return null
}
