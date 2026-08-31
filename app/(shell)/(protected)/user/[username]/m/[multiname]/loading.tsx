import {FeedContainer} from '@/components/layout/FeedContainer/FeedContainer'
import {TabsSkeleton} from '@/components/skeletons/TabsSkeleton/TabsSkeleton'
import {Skeleton} from '@mantine/core'

/**
 * Loading UI for multireddit pages.
 * Shown while fetching multireddit posts.
 */
export default function Loading() {
  return (
    <FeedContainer>
      <Skeleton height={28} width={200} mb="lg" />
      <TabsSkeleton />
    </FeedContainer>
  )
}
