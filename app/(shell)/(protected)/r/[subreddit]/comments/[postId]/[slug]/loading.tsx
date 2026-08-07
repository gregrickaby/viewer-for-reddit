import {FeedContainer} from '@/components/layout/FeedContainer/FeedContainer'
import {CommentListSkeleton} from '@/components/skeletons/CommentSkeleton/CommentSkeleton'
import {PostSkeleton} from '@/components/skeletons/PostSkeleton/PostSkeleton'
import {Title} from '@mantine/core'

/**
 * Loading UI for post detail pages.
 * Shown while fetching post and comments.
 */
export default function Loading() {
  return (
    <FeedContainer>
      <PostSkeleton />
      <div id="comments" style={{scrollMarginTop: '80px'}}>
        <Title order={3} mb="lg">
          Comments
        </Title>
        <CommentListSkeleton />
      </div>
    </FeedContainer>
  )
}
