import {FeedContainer} from '@/components/layout/FeedContainer/FeedContainer'
import {PostSkeleton} from '@/components/skeletons/PostSkeleton/PostSkeleton'
import {Title} from '@mantine/core'

/**
 * Loading UI for search pages.
 * Shown while searching Reddit.
 */
export default function Loading() {
  return (
    <FeedContainer>
      <Title order={2}>Searching...</Title>
      <PostSkeleton />
    </FeedContainer>
  )
}
