import {Card} from '@/components/UI/Post/Card/Card'
import type {AutoPostChild} from '@/lib/store/services/postsApi'
import {Button, Group, Loader, Title} from '@mantine/core'
import type {ReactNode} from 'react'

interface UseFeedRendererProps {
  data: any
  isLoading: boolean
  isError: boolean
  noVisiblePosts: boolean
  wasFiltered: boolean
  emptyMessage?: string
  errorContent?: ReactNode
  hasNextPage?: boolean
  isFetchingNextPage?: boolean
  fetchNextPage?: () => void
  loadMoreRef?: (node?: Element | null) => void
}

/**
 * Hook for rendering common feed states (loading, error, empty, success).
 *
 * Extracts duplicated rendering logic from feed components to reduce code duplication
 * and maintain consistency across different feed types.
 *
 * @param props - Feed state and configuration
 * @returns Object containing render content and state indicator
 */
export function useFeedRenderer({
  data,
  isLoading,
  isError,
  noVisiblePosts,
  wasFiltered,
  emptyMessage = 'No posts found!',
  errorContent,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  loadMoreRef
}: UseFeedRendererProps) {
  // Loading state
  if (isLoading) {
    return {
      content: (
        <Group justify="center" mt="lg">
          <Loader />
        </Group>
      ),
      status: 'loading' as const,
      loadMoreSection: null
    }
  }

  // Error state
  if (isError) {
    return {
      content: errorContent,
      status: 'error' as const,
      loadMoreSection: null
    }
  }

  // Empty state
  if (noVisiblePosts) {
    return {
      content: (
        <Title order={4} ta="center" mt="lg" c="red">
          {wasFiltered
            ? 'You need to enable the "Allow NSFW" setting to see posts'
            : emptyMessage}
        </Title>
      ),
      status: 'empty' as const,
      loadMoreSection: null
    }
  }

  // Success state - render posts
  const postContent = data?.pages.flatMap((page: any) =>
    (page?.data?.children ?? []).map((post: AutoPostChild) =>
      post?.data ? <Card key={post.data.id} post={post.data} /> : null
    )
  )

  // Load more section
  const loadMoreSection =
    hasNextPage && !wasFiltered ? (
      <div ref={loadMoreRef} style={{minHeight: 60}}>
        {isFetchingNextPage ? (
          <Group justify="center">
            <Loader />
          </Group>
        ) : (
          <Button fullWidth onClick={fetchNextPage}>
            Load More
          </Button>
        )}
      </div>
    ) : null

  return {
    content: postContent,
    status: 'success' as const,
    loadMoreSection
  }
}
