'use client'

import {usePostNavigation} from '@/lib/contexts/PostNavigationContext'
import type {RedditPost} from '@/lib/types/reddit'
import {extractSlug} from '@/lib/utils/reddit-helpers'
import {useEffect} from 'react'

/**
 * Props for PostNavigationTracker component.
 */
interface PostNavigationTrackerProps {
  /** Array of posts from feed (for list pages) */
  posts?: RedditPost[]
  /** Current post ID (for single post pages) */
  currentPostId?: string
}

/**
 * PostNavigationTracker - unified tracker for post navigation context.
 *
 * This client component handles both list and single post tracking:
 * - On list pages: Registers post array for navigation
 * - On post pages: Sets current post ID
 *
 * Navigation context persistence:
 * - Posts array is preserved across page navigations to enable swipe navigation
 * - Only currentPostId is cleared on unmount to reset active post state
 * - This allows users to swipe through posts from the originating feed
 *
 * Must be used within PostNavigationProvider.
 *
 * @param posts - Array of Reddit posts from the feed (optional)
 * @param currentPostId - ID of current post being viewed (optional, must include t3_ prefix)
 *
 * @example
 * ```typescript
 * // List page
 * <PostNavigationTracker posts={posts} />
 *
 * // Post page
 * <PostNavigationTracker currentPostId="t3_abc123" />
 * ```
 */
export function PostNavigationTracker({
  posts,
  currentPostId
}: Readonly<PostNavigationTrackerProps>) {
  const {setPosts, setCurrentPostId} = usePostNavigation()

  useEffect(() => {
    // Register posts if provided (list page)
    if (posts) {
      const navigablePosts = posts.map((post) => {
        const slug = extractSlug(post.permalink, post.id)
        return {
          id: post.name,
          url: `/r/${post.subreddit}/comments/${post.id}/${slug}`,
          title: post.title
        }
      })
      setPosts(navigablePosts)
    }

    // Set current post if provided (post page)
    if (currentPostId) {
      setCurrentPostId(currentPostId)
    }

    // Cleanup on unmount: only clear currentPostId, keep posts for navigation
    return () => {
      if (currentPostId) {
        setCurrentPostId(null)
      }
    }
  }, [posts, currentPostId, setPosts, setCurrentPostId])

  // This component has no visual output
  return null
}
