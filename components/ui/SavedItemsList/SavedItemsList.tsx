'use client'

import {useInfiniteSavedItems} from '@/lib/hooks/useInfiniteSavedItems'
import type {SavedItem} from '@/lib/types/reddit'
import {Center, Container, Divider, Loader, Stack, Text} from '@mantine/core'
import {ViewTransition} from 'react'
import {Comment} from '@/components/ui/Comment/Comment'
import {PostCard} from '@/components/ui/PostCard/PostCard'

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
}

/**
 * Display a user's saved posts and comments with infinite scroll.
 * Renders posts as PostCard and comments as Comment within a context card.
 */
export function SavedItemsList({
  initialItems,
  username,
  initialAfter
}: Readonly<SavedItemsListProps>) {
  const {items, loading, hasMore, error, sentinelRef, removeItem} =
    useInfiniteSavedItems({
      initialItems,
      initialAfter,
      username
    })

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
              <ViewTransition key={`post-${item.data.id}-${index}`}>
                <PostCard
                  post={item.data}
                  onUnsave={() => removeItem(item.data.id)}
                />
              </ViewTransition>
            )
          }
          return (
            <ViewTransition key={`comment-${item.data.id}-${index}`}>
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
                  onUnsave={() => removeItem(item.data.id)}
                />
                <Divider mt="xs" />
              </Stack>
            </ViewTransition>
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
