import {Group, Skeleton, Stack} from '@mantine/core'
import {PostListSkeleton} from '@/components/skeletons/PostSkeleton/PostSkeleton'

/** Skeleton loading placeholder for a tabbed post list. Mimics the PostListWithTabs component structure. */
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
