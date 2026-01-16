import {Group, Skeleton, Stack} from '@mantine/core'
import {PostListSkeleton} from '../PostSkeleton/PostSkeleton'

/**
 * Skeleton loading placeholder for tabbed post list.
 * Mimics the structure of PostListWithTabs component.
 *
 * Features:
 * - 4 tab button skeletons
 * - 3 post card skeletons below tabs
 *
 * @example
 * ```typescript
 * <Suspense fallback={<TabsSkeleton />}>
 *   <PostListWithTabs posts={posts} activeSort="hot" />
 * </Suspense>
 * ```
 */
export function TabsSkeleton() {
  return (
    <Stack gap="md">
      <Group gap="xs" mb="lg" wrap="nowrap" style={{overflowX: 'auto'}}>
        <Skeleton height={36} width={80} radius="md" />
        <Skeleton height={36} width={80} radius="md" />
        <Skeleton height={36} width={80} radius="md" />
        <Skeleton height={36} width={80} radius="md" />
      </Group>

      <PostListSkeleton count={3} />
    </Stack>
  )
}
