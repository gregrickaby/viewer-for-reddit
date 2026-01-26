import {CommentListSkeleton} from '@/components/skeletons/CommentSkeleton/CommentSkeleton'
import {PostSkeleton} from '@/components/skeletons/PostSkeleton/PostSkeleton'
import {CommentListWithTabs} from '@/components/ui/CommentListWithTabs/CommentListWithTabs'
import {ErrorBoundary} from '@/components/ui/ErrorBoundary/ErrorBoundary'
import {PostCard} from '@/components/ui/PostCard/PostCard'
import {fetchPost} from '@/lib/actions/reddit'
import {getSession} from '@/lib/auth/session'
import {appConfig} from '@/lib/config/app.config'
import {Container, Stack, Title} from '@mantine/core'
import type {Metadata} from 'next'
import {notFound} from 'next/navigation'
import {Suspense} from 'react'

import {CommentSortOption} from '@/lib/types/reddit'

interface PageProps {
  params: Promise<{
    subreddit: string
    postId: string
    slug: string
  }>
  searchParams: Promise<{sort?: string}>
}

/**
 * Generate static metadata for single post pages.
 */
export async function generateMetadata({params}: PageProps): Promise<Metadata> {
  const {subreddit, postId} = await params
  const title = `Post in r/${subreddit} - ${appConfig.site.name}`
  const description = `View post and comments in r/${subreddit}`
  const canonicalUrl = `/r/${subreddit}/comments/${postId}/`

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl
    },
    robots: {
      index: false,
      follow: true
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: 'article',
      images: [
        {
          url: '/social-share.webp',
          width: 1200,
          height: 630,
          alt: appConfig.site.name
        }
      ]
    }
  }
}

/**
 * Post detail component - fetches and displays a single post.
 * Shows full post content with media and text.
 *
 * @param subreddit - Subreddit name
 * @param postId - Post ID (Reddit Thing ID)
 */
async function PostDetail({
  subreddit,
  postId
}: Readonly<{
  subreddit: string
  postId: string
}>) {
  const {post} = await fetchPost(subreddit, postId)
  const session = await getSession()
  const isAuthenticated = !!session.accessToken

  if (!post) {
    notFound()
  }

  return <PostCard post={post} isAuthenticated={isAuthenticated} showFullText />
}

/**
 * Comment list component - fetches and displays comments with sort tabs.
 *
 * @param subreddit - Subreddit name
 * @param postId - Post ID
 * @param sort - Comment sort option (best, top, new, controversial, old, qa)
 */
async function CommentList({
  subreddit,
  postId,
  sort = 'best'
}: Readonly<{
  subreddit: string
  postId: string
  sort?: CommentSortOption
}>) {
  const {comments} = await fetchPost(subreddit, postId, sort)
  const session = await getSession()
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
 * Post page - displays a single post with comments.
 *
 * Features:
 * - Full post card with media and text
 * - Comments with sort tabs (best, top, new, controversial, old, qa)
 * - Nested comment rendering
 * - Vote and save buttons
 * - Boss button and back-to-top button
 *
 * @param params - URL params (subreddit, postId, slug)
 * @param searchParams - URL search params (comment sort option)
 */
export default async function PostPage({
  params,
  searchParams
}: Readonly<PageProps>) {
  const {subreddit, postId} = await params
  const {sort} = await searchParams
  const commentSort = (sort as CommentSortOption) || 'best'

  return (
    <Container size="lg">
      <Stack gap="xl" maw={800}>
        <ErrorBoundary title="Failed to load post">
          <Suspense fallback={<PostSkeleton />}>
            <PostDetail subreddit={subreddit} postId={postId} />
          </Suspense>
        </ErrorBoundary>

        <div id="comments" style={{scrollMarginTop: '80px'}}>
          <Title order={3} mb="lg">
            Comments
          </Title>
          <ErrorBoundary title="Failed to load comments">
            <Suspense fallback={<CommentListSkeleton />}>
              <CommentList
                subreddit={subreddit}
                postId={postId}
                sort={commentSort}
              />
            </Suspense>
          </ErrorBoundary>
        </div>
      </Stack>
    </Container>
  )
}
