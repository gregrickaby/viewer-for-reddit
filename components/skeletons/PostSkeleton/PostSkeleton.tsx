import {Divider, Group, Skeleton, Stack} from '@mantine/core'

/** Skeleton loading placeholder for a single post card. Mimics the borderless PostCard component structure. */
export function PostSkeleton() {
  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Skeleton height={20} width="60%" />
        <Skeleton height={20} width={50} />
      </Group>
      <Skeleton height={12} width="40%" />
      <Skeleton height={700} />
      <Group gap="md">
        <Skeleton height={30} width={80} />
        <Skeleton height={30} width={80} />
        <Skeleton height={30} width={80} />
      </Group>
      <Divider mt="xs" />
    </Stack>
  )
}

/** Skeleton loading placeholder for a list of posts. */
export function PostListSkeleton({
  count = 5
}: Readonly<{
  /** Number of skeleton post cards to render */
  count?: number
}>) {
  return (
    <Stack gap="md">
      {Array.from({length: count}, (_, index) => (
        <PostSkeleton key={index} />
      ))}
    </Stack>
  )
}
