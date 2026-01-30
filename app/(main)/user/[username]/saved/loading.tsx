import {PostSkeleton} from '@/components/skeletons/PostSkeleton/PostSkeleton'
import {Container, Title} from '@mantine/core'

/**
 * Loading UI for saved items pages.
 * Shown while fetching saved posts and comments.
 */
export default function Loading() {
  return (
    <Container size="lg">
      <Title order={2} mb="md">
        Saved
      </Title>
      <PostSkeleton />
    </Container>
  )
}
