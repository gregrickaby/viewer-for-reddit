import {Divider, Group, Skeleton, Stack} from '@mantine/core'

/** Skeleton loading placeholder for a single post card. Mimics the borderless PostCard component structure. */
export function PostSkeleton() {
  return (
    <Stack gap="xs">
      <Group gap={6}>
        <Skeleton height={20} width={70} radius="sm" />
        <Skeleton height={14} width={150} />
      </Group>
      <Skeleton height={22} width="80%" mt={2} />
      <Skeleton height={700} />
      <Group gap="sm">
        <Skeleton height={26} width={70} radius="xl" />
        <Skeleton height={26} width={50} radius="xl" />
        <Skeleton height={26} width={50} radius="xl" />
        <Skeleton height={26} width={50} radius="xl" />
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
