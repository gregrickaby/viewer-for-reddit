import {FeedContainer} from '@/components/layout/FeedContainer/FeedContainer'
import {CommentListSkeleton} from '@/components/skeletons/CommentSkeleton/CommentSkeleton'
import {PostSkeleton} from '@/components/skeletons/PostSkeleton/PostSkeleton'
import {CommentListWithTabs} from '@/components/ui/CommentListWithTabs/CommentListWithTabs'
import {DirectionalTransition} from '@/components/ui/DirectionalTransition/DirectionalTransition'
import {DynamicMetadataMarker} from '@/components/ui/DynamicMetadataMarker/DynamicMetadataMarker'
import {PostCard} from '@/components/ui/PostCard/PostCard'
import {RecordRecentPost} from '@/components/ui/RecordRecentPost/RecordRecentPost'
import {fetchPost} from '@/lib/actions/reddit/posts'
import {CommentSortOption} from '@/lib/types/reddit'
import {generatePostMetadata} from '@/lib/utils/metadata-helpers'
import {Title} from '@mantine/core'
import type {Metadata} from 'next'
import {notFound} from 'next/navigation'
import {Suspense, ViewTransition} from 'react'

type ThreadParams = Promise<{
  subreddit: string
  postId: string
  slug: string
  commentId?: string
}>

type ThreadSearchParams = Promise<{sort?: string}>

/**
 * Shared metadata generator for post and comment permalink pages.
 * Fetches the post to build the actual title and social tags.
 */
export async function generatePostThreadMetadata(
  params: ThreadParams
): Promise<Metadata> {
  const {subreddit, postId, slug} = await params
  const {post} = await fetchPost(subreddit, postId)

  if (!post) {
    notFound()
  }

  return generatePostMetadata(
    post,
    `/r/${subreddit}/comments/${postId}/${slug}`
  )
}

/**
 * Post detail component - fetches and displays a single post.
 */
async function PostDetail({params}: Readonly<{params: ThreadParams}>) {
  const {subreddit, postId} = await params
  const {post} = await fetchPost(subreddit, postId)

  if (!post) {
    notFound()
  }

  return (
    <>
      <RecordRecentPost post={post} />
      <PostCard post={post} showFullText />
    </>
  )
}

/**
 * Comment list component - displays comments, optionally focused on a
 * specific comment thread when the route carries a `commentId`.
 */
async function CommentList({
  params,
  searchParams
}: Readonly<{
  params: ThreadParams
  searchParams: ThreadSearchParams
}>) {
  const {subreddit, postId, commentId} = await params
  const {sort} = await searchParams
  const commentSort = (sort as CommentSortOption) || 'best'

  const {comments} = await fetchPost(subreddit, postId, commentSort, commentId)

  return <CommentListWithTabs comments={comments} activeSort={commentSort} />
}

/**
 * Shared page body for the post detail and comment permalink routes.
 * Streams the post and comments behind their own Suspense boundaries.
 */
export function PostThread({
  params,
  searchParams
}: Readonly<{
  params: ThreadParams
  searchParams: ThreadSearchParams
}>) {
  return (
    <DirectionalTransition>
      <FeedContainer>
        <DynamicMetadataMarker />
        <Suspense
          fallback={
            <ViewTransition exit="slide-down">
              <PostSkeleton />
            </ViewTransition>
          }
        >
          <ViewTransition enter="slide-up" default="none">
            <PostDetail params={params} />
          </ViewTransition>
        </Suspense>

        <div id="comments" style={{scrollMarginTop: '80px'}}>
          <Title order={3} mb="lg">
            Comments
          </Title>
          <Suspense
            fallback={
              <ViewTransition exit="slide-down">
                <CommentListSkeleton />
              </ViewTransition>
            }
          >
            <ViewTransition enter="slide-up" default="none">
              <CommentList params={params} searchParams={searchParams} />
            </ViewTransition>
          </Suspense>
        </div>
      </FeedContainer>
    </DirectionalTransition>
  )
}
