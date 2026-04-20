'use client'

import {useInfiniteScroll} from '@/lib/hooks/useInfiniteScroll'
import {RedditPost} from '@/lib/types/reddit'
import {Center, Loader, Stack, Text} from '@mantine/core'
import {PostCard} from '@/components/ui/PostCard/PostCard'
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
  /** Subreddit to search within (disables infinite scroll) */
  searchSubreddit?: string
  /** Username (disables infinite scroll) */
  username?: string
  /** Whether the current user is authenticated */
  isAuthenticated?: boolean
}

/**
 * Display a list of Reddit posts with infinite scroll.
 * Automatically loads more posts when scrolling near the bottom.
 */
export function PostList({
  initialPosts,
  initialAfter,
  subreddit,
  searchQuery,
  searchSubreddit,
  username,
  isAuthenticated = false
}: Readonly<PostListProps>) {
  // Disable infinite scroll for search and user pages (not supported yet)
  const disableInfiniteScroll = !!(searchQuery || searchSubreddit || username)

  const {posts, hasMore, sentinelRef} = useInfiniteScroll({
    initialPosts,
    initialAfter: disableInfiniteScroll ? null : initialAfter,
    subreddit
  })

  return (
    <Stack gap="md" className={styles.container}>
      {posts.map((post, index) => (
        <PostCard
          key={post.id}
          post={post}
          isAuthenticated={isAuthenticated}
          priority={index < 2}
        />
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
