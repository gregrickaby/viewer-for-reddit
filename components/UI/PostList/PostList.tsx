'use client'

import {useInfiniteScroll} from '@/lib/hooks'
import {RedditPost} from '@/lib/types/reddit'
import {Center, Loader, Stack, Text} from '@mantine/core'
import {PostCard} from '../PostCard/PostCard'
import styles from './PostList.module.css'

/**
 * Props for the PostList component.
 */
interface PostListProps {
  /** Initial posts from server */
  initialPosts: RedditPost[]
  /** Pagination cursor for next page */
  initialAfter?: string | null
  /** Subreddit name (for infinite scroll) */
  subreddit?: string
  /** Search query (disables infinite scroll) */
  searchQuery?: string
  /** Username (disables infinite scroll) */
  username?: string
  /** Whether the current user is authenticated */
  isAuthenticated?: boolean
}

/**
 * Display a list of Reddit posts with infinite scroll.
 * Automatically loads more posts when scrolling near the bottom.
 *
 * Features:
 * - Infinite scroll for subreddit/multireddit feeds
 * - Disabled infinite scroll for search/user pages
 * - Loading indicator at bottom
 * - "No more posts" message when exhausted
 *
 * Note: Infinite scroll currently only works for subreddit/multireddit feeds.
 * Search and user profile pages do not support infinite scroll yet.
 *
 * @example
 * ```typescript
 * <PostList
 *   initialPosts={serverPosts}
 *   initialAfter="t3_abc123"
 *   subreddit="popular"
 *   isAuthenticated={true}
 * />
 * ```
 */
export function PostList({
  initialPosts,
  initialAfter,
  subreddit,
  searchQuery,
  username,
  isAuthenticated = false
}: Readonly<PostListProps>) {
  // Disable infinite scroll for search and user pages (not supported yet)
  const disableInfiniteScroll = !!(searchQuery || username)

  const {posts, hasMore, sentinelRef} = useInfiniteScroll({
    initialPosts,
    initialAfter: disableInfiniteScroll ? null : initialAfter,
    subreddit
  })

  return (
    <Stack gap="md" className={styles.container}>
      {posts.map((post) => (
        <PostCard key={post.id} post={post} isAuthenticated={isAuthenticated} />
      ))}

      {hasMore && (
        <div ref={sentinelRef} className={styles.sentinel}>
          <Center>
            <Loader size="md" />
          </Center>
        </div>
      )}

      {!hasMore && posts.length > 0 && (
        <Center py="xl">
          <Text c="dimmed" size="sm">
            No more posts
          </Text>
        </Center>
      )}
    </Stack>
  )
}
