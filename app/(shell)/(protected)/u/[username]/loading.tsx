import {FeedContainer} from '@/components/layout/FeedContainer/FeedContainer'
import {PostSkeleton} from '@/components/skeletons/PostSkeleton/PostSkeleton'
import {TabsSkeleton} from '@/components/skeletons/TabsSkeleton/TabsSkeleton'

/**
 * Loading UI for user profile pages.
 * Shown while fetching user info, posts, and comments.
 */
export default function Loading() {
  return (
    <FeedContainer>
      <PostSkeleton />
      <TabsSkeleton />
    </FeedContainer>
  )
}
