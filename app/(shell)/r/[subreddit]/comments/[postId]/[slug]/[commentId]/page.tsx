import {CommentListWithTabs} from '@/components/ui/CommentListWithTabs/CommentListWithTabs'
import {PostCard} from '@/components/ui/PostCard/PostCard'
import {fetchPost} from '@/lib/actions/reddit/posts'
import {getSession} from '@/lib/auth/session'
import {CommentSortOption} from '@/lib/types/reddit'
import {generatePostMetadata} from '@/lib/utils/metadata-helpers'
import {Container, Stack, Title} from '@mantine/core'
import type {Metadata} from 'next'
import {notFound} from 'next/navigation'

interface PageProps {
  params: Promise<{
    subreddit: string
    postId: string
    slug: string
    commentId: string
  }>
  searchParams: Promise<{sort?: string}>
}

/**
 * Generate static metadata for single comment pages.
 */
export async function generateMetadata({params}: PageProps): Promise<Metadata> {
  const {subreddit, postId, slug} = await params

  const {post} = await fetchPost(subreddit, postId)

  if (!post) {
    notFound()
  }

  const canonicalUrl = `/r/${subreddit}/comments/${postId}/${slug}`
  return generatePostMetadata(post, canonicalUrl)
}

/**
 * Post detail component - fetches and displays a single post.
 */
async function PostDetail({
  subreddit,
  postId
}: Readonly<{
  subreddit: string
  postId: string
}>) {
  const [{post}, session] = await Promise.all([
    fetchPost(subreddit, postId),
    getSession()
  ])
  const isAuthenticated = !!session.accessToken

  if (!post) {
    notFound()
  }

  return <PostCard post={post} isAuthenticated={isAuthenticated} showFullText />
}

/**
 * Comment list component - fetches and displays comments focused on a specific comment.
 */
async function CommentList({
  subreddit,
  postId,
  commentId,
  sort = 'best'
}: Readonly<{
  subreddit: string
  postId: string
  commentId: string
  sort?: CommentSortOption
}>) {
  const [{comments}, session] = await Promise.all([
    fetchPost(subreddit, postId, sort, commentId),
    getSession()
  ])
  const isAuthenticated = !!session.accessToken

  return (
    <CommentListWithTabs
      comments={comments}
      activeSort={sort}
      isAuthenticated={isAuthenticated}
    />
  )
}

/**
 * Comment permalink page - displays a single post with a focused comment thread.
 *
 * @param params - URL params (subreddit, postId, slug, commentId)
 * @param searchParams - URL search params (comment sort option)
 */
export default async function CommentPage({
  params,
  searchParams
}: Readonly<PageProps>) {
  const {subreddit, postId, commentId} = await params
  const {sort} = await searchParams
  const commentSort = (sort as CommentSortOption) || 'best'

  return (
    <Container size="lg">
      <Stack gap="xl" maw={800}>
        <PostDetail subreddit={subreddit} postId={postId} />

        <div id="comments" style={{scrollMarginTop: '80px'}}>
          <Title order={3} mb="lg">
            Comments
          </Title>
          <CommentList
            subreddit={subreddit}
            postId={postId}
            commentId={commentId}
            sort={commentSort}
          />
        </div>
      </Stack>
    </Container>
  )
}
