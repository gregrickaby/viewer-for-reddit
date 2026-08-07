import {FeedContainer} from '@/components/layout/FeedContainer/FeedContainer'
import {TabsSkeleton} from '@/components/skeletons/TabsSkeleton/TabsSkeleton'

/**
 * Loading UI for multireddit pages.
 * Shown while fetching multireddit posts.
 */
export default function Loading() {
  return (
    <FeedContainer>
      <TabsSkeleton />
    </FeedContainer>
  )
}
