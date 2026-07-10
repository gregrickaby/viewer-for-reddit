import {PostSkeleton} from '@/components/skeletons/PostSkeleton/PostSkeleton'
import {Container, Skeleton, Stack} from '@mantine/core'

/**
 * Loading skeleton for subreddit search page.
 * Displays while search results are being fetched.
 */
export default function Loading() {
  return (
    <Container size="lg">
      <Stack gap="xl" maw={800}>
        <Stack gap="sm">
          <Skeleton height={20} width={150} />
          <Skeleton height={36} width="60%" />
          <Skeleton height={16} width={100} />
        </Stack>
        <Stack gap="md">
          <PostSkeleton />
          <PostSkeleton />
          <PostSkeleton />
        </Stack>
      </Stack>
    </Container>
  )
}
