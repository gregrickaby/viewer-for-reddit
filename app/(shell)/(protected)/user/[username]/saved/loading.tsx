import {FeedContainer} from '@/components/layout/FeedContainer/FeedContainer'
import {PostSkeleton} from '@/components/skeletons/PostSkeleton/PostSkeleton'
import {Title} from '@mantine/core'

/**
 * Loading UI for saved items pages.
 * Shown while fetching saved posts and comments.
 */
export default function Loading() {
  return (
    <FeedContainer>
      <Title order={2} mb="md">
        Saved
      </Title>
      <PostSkeleton />
    </FeedContainer>
  )
}
