'use client'

import {fetchSavedItems} from '@/lib/actions/reddit'
import type {SavedItem} from '@/lib/types/reddit'
import {logger} from '@/lib/utils/logger'
import {Card, Center, Container, Loader, Stack, Text} from '@mantine/core'
import {useCallback, useEffect, useRef, useState} from 'react'
import {Comment} from '../Comment/Comment'
import {PostCard} from '../PostCard/PostCard'

/**
 * Props for the SavedItemsList component.
 */
interface SavedItemsListProps {
  /** Initial items from server */
  initialItems: SavedItem[]
  /** Username of the user whose saved items to display */
  username: string
  /** Initial pagination cursor */
  initialAfter: string | null
  /** Whether the current user is authenticated */
  isAuthenticated?: boolean
}

/**
 * Display saved items (posts and comments) with infinite scroll.
 * Client component for interactivity with optimistic updates.
 *
 * Features:
 * - Infinite scroll pagination
 * - Error handling and display
 * - Loading states
 * - NSFW blur filter
 * - Renders both posts and comments appropriately
 *
 * @example
 * ```typescript
 * <SavedItemsList
 *   initialItems={items}
 *   username="johndoe"
 *   initialAfter={after}
 *   isAuthenticated={true}
 * />
 * ```
 */
export function SavedItemsList({
  initialItems,
  username,
  initialAfter,
  isAuthenticated = false
}: Readonly<SavedItemsListProps>) {
  const [items, setItems] = useState<SavedItem[]>(initialItems)
  const [after, setAfter] = useState<string | null>(initialAfter)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(!!initialAfter)
  const [error, setError] = useState<string | null>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)

  // Handler to remove an item from the list when unsaved
  const handleItemRemoved = useCallback((itemId: string) => {
    setItems((prev) => prev.filter((item) => item.data.id !== itemId))
  }, [])

  const loadMore = useCallback(async () => {
    if (loading || !after || !hasMore) return

    setLoading(true)
    setError(null)

    try {
      const result = await fetchSavedItems(username, after)

      if (result.items && result.items.length > 0) {
        setItems((prev) => [...prev, ...result.items])
        setAfter(result.after)
        setHasMore(!!result.after)
      } else {
        setHasMore(false)
      }
    } catch (err) {
      logger.error('Failed to load more saved items', err, {
        context: 'SavedItemsList',
        username
      })
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to load more items'
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
      <Center py="xl">
        <Stack gap="xs" align="center">
          <Text fw={600}>Failed to load saved items</Text>
          <Text size="sm" c="dimmed">
            {error}
          </Text>
        </Stack>
      </Center>
    )
  }

  return (
    <Container size="lg" px={0}>
      <Stack gap="md">
        {items.map((item, index) => {
          if (item.type === 'post') {
            return (
              <PostCard
                key={`post-${item.data.id}-${index}`}
                post={item.data}
                isAuthenticated={isAuthenticated}
                onUnsave={() => handleItemRemoved(item.data.id)}
              />
            )
          }
          return (
            <Card key={`comment-${item.data.id}-${index}`} p="md" withBorder>
              <Stack gap="xs">
                <Text size="sm" c="dimmed">
                  Comment on{' '}
                  {item.data.link_title && (
                    <Text component="span" fw={500}>
                      {item.data.link_title}
                    </Text>
                  )}
                  {item.data.subreddit && (
                    <Text component="span"> in r/{item.data.subreddit}</Text>
                  )}
                </Text>
                <Comment
                  comment={item.data}
                  depth={0}
                  isAuthenticated={isAuthenticated}
                  onUnsave={() => handleItemRemoved(item.data.id)}
                />
              </Stack>
            </Card>
          )
        })}
        {hasMore && (
          <div ref={sentinelRef}>
            {loading && (
              <Center py="xl">
                <Loader size="md" />
              </Center>
            )}
          </div>
        )}
        {!hasMore && items.length > 0 && (
          <Center py="xl">
            <Text size="sm" c="dimmed">
              No more saved items
            </Text>
          </Center>
        )}
      </Stack>
    </Container>
  )
}
