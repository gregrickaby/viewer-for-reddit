import {PostSkeleton} from '@/components/skeletons/PostSkeleton/PostSkeleton'
import {TabsSkeleton} from '@/components/skeletons/TabsSkeleton/TabsSkeleton'
import {Container, Stack} from '@mantine/core'

/**
 * Loading UI for user profile pages.
 * Shown while fetching user info, posts, and comments.
 */
export default function Loading() {
  return (
    <Container size="lg">
      <Stack gap="xl" maw={800}>
        <PostSkeleton />
        <TabsSkeleton />
      </Stack>
    </Container>
  )
}
