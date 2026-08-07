import {FeedContainer} from '@/components/layout/FeedContainer/FeedContainer'
import {SubredditInfoSkeleton} from '@/components/skeletons/SubredditInfoSkeleton/SubredditInfoSkeleton'
import {TabsSkeleton} from '@/components/skeletons/TabsSkeleton/TabsSkeleton'

/**
 * Loading UI for subreddit pages.
 * Shown while fetching subreddit info and posts.
 */
export default function Loading() {
  return (
    <FeedContainer>
      <SubredditInfoSkeleton />
      <TabsSkeleton />
    </FeedContainer>
  )
}
