import {FeedContainer} from '@/components/layout/FeedContainer/FeedContainer'
import {TabsSkeleton} from '@/components/skeletons/TabsSkeleton/TabsSkeleton'

/**
 * Loading UI for main layout routes.
 * Shown while route segments are loading.
 *
 * Next.js automatically shows this while fetching data.
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/loading
 */
export default function Loading() {
  return (
    <FeedContainer>
      <TabsSkeleton />
    </FeedContainer>
  )
}
