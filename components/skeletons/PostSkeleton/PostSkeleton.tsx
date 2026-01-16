import {Card, Group, Skeleton, Stack} from '@mantine/core'

/**
 * Skeleton loading placeholder for a single post card.
 * Mimics the structure of PostCard component.
 *
 * @example
 * ```typescript
 * <Suspense fallback={<PostSkeleton />}>
 *   <PostCard post={post} />
 * </Suspense>
 * ```
 */
export function PostSkeleton() {
  return (
    <Card withBorder padding="lg" radius="md">
      <Stack gap="md">
        <Group justify="space-between">
          <Skeleton height={20} width="60%" />
          <Skeleton height={20} width={50} />
        </Group>
        <Skeleton height={12} width="40%" />
        <Skeleton height={200} />
        <Group gap="md">
          <Skeleton height={30} width={80} />
          <Skeleton height={30} width={80} />
          <Skeleton height={30} width={80} />
        </Group>
      </Stack>
    </Card>
  )
}

/**
 * Skeleton loading placeholder for a list of posts.
 * Renders multiple PostSkeleton components.
 *
 * @param count - Number of skeleton posts to render (default: 5)
 *
 * @example
 * ```typescript
 * <Suspense fallback={<PostListSkeleton count={10} />}>
 *   <PostList posts={posts} />
 * </Suspense>
 * ```
 */
export function PostListSkeleton({count = 5}: Readonly<{count?: number}>) {
  const skeletonIds = Array.from({length: count}, () => crypto.randomUUID())
  return (
    <Stack gap="md">
      {skeletonIds.map((id) => (
        <PostSkeleton key={id} />
      ))}
    </Stack>
  )
}
