'use client'

import {fetchSavedPosts} from '@/lib/actions/reddit'
import type {RedditPost} from '@/lib/types/reddit'
import {logger} from '@/lib/utils/logger'
import {Center, Container, Loader, Stack, Text} from '@mantine/core'
import {useCallback, useEffect, useRef, useState} from 'react'
import {ErrorDisplay} from '../ErrorDisplay/ErrorDisplay'
import {PostCard} from '../PostCard/PostCard'

/**
 * Props for the SavedPostsList component.
 */
interface SavedPostsListProps {
  /** Initial posts from server */
  initialPosts: RedditPost[]
  /** Username of the user whose saved posts to display */
  username: string
  /** Initial pagination cursor */
  initialAfter: string | null
}

/**
 * Display saved posts with infinite scroll.
 * Client component for interactivity with optimistic updates.
 *
 * Features:
 * - Infinite scroll pagination
 * - Error handling and display
 * - Loading states
 * - NSFW blur filter
 *
 * @example
 * ```typescript
 * <SavedPostsList
 *   initialPosts={posts}
 *   username="johndoe"
 *   initialAfter={after}
 * />
 * ```
 */
export function SavedPostsList({
  initialPosts,
  username,
  initialAfter
}: Readonly<SavedPostsListProps>) {
  const [posts, setPosts] = useState<RedditPost[]>(initialPosts)
  const [after, setAfter] = useState<string | null>(initialAfter)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(!!initialAfter)
  const [error, setError] = useState<string | null>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)

  const loadMore = useCallback(async () => {
    if (loading || !after || !hasMore) return

    setLoading(true)
    setError(null)

    try {
      const result = await fetchSavedPosts(username, after)

      if (result.posts && result.posts.length > 0) {
        setPosts((prev) => [...prev, ...result.posts])
        setAfter(result.after)
        setHasMore(!!result.after)
      } else {
        setHasMore(false)
      }
    } catch (err) {
      logger.error('Failed to load more saved posts', err, {
        context: 'SavedPostsList',
        username
      })
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to load more posts'
      setError(errorMessage)
      setHasMore(false)
    } finally {
      setLoading(false)
    }
  }, [loading, after, hasMore, username])

  const sentinelRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (loading) return

      if (observerRef.current) {
        observerRef.current.disconnect()
      }

      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadMore()
        }
      })

      if (node) {
        observerRef.current.observe(node)
      }
    },
    [loading, hasMore, loadMore]
  )

  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [])

  if (error) {
    return (
      <ErrorDisplay
        title="Failed to load saved posts"
        message={error}
        showRetry
      />
    )
  }

  return (
    <Container size="lg" px={0}>
      <Stack gap="md">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
        {hasMore && (
          <div ref={sentinelRef}>
            {loading && (
              <Center py="xl">
                <Loader size="md" />
              </Center>
            )}
          </div>
        )}
        {!hasMore && posts.length > 0 && (
          <Center py="xl">
            <Text size="sm" c="dimmed">
              No more saved posts
            </Text>
          </Center>
        )}
      </Stack>
    </Container>
  )
}
