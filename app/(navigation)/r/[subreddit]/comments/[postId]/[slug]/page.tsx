import {AppLayout} from '@/components/layout/AppLayout/AppLayout'
import {CommentListSkeleton} from '@/components/skeletons/CommentSkeleton/CommentSkeleton'
import {PostSkeleton} from '@/components/skeletons/PostSkeleton/PostSkeleton'
import BackToTop from '@/components/ui/BackToTop/BackToTop'
import BossButton from '@/components/ui/BossButton/BossButton'
import {CommentListWithTabs} from '@/components/ui/CommentListWithTabs/CommentListWithTabs'
import {ErrorBoundary} from '@/components/ui/ErrorBoundary/ErrorBoundary'
import {ErrorDisplay} from '@/components/ui/ErrorDisplay/ErrorDisplay'
import {PostCard} from '@/components/ui/PostCard/PostCard'
import {PostNavigationTracker} from '@/components/ui/PostNavigationTracker/PostNavigationTracker'
import SwipeNavigation from '@/components/ui/SwipeNavigation/SwipeNavigation'
import {
  fetchMultireddits,
  fetchPost,
  fetchUserSubscriptions,
  getCurrentUserAvatar
} from '@/lib/actions/reddit'
import {getSession} from '@/lib/auth/session'
import {appConfig} from '@/lib/config/app.config'
import {logger} from '@/lib/utils/logger'
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
  try {
    const {post} = await fetchPost(subreddit, postId)
    const session = await getSession()
    const isAuthenticated = !!session.accessToken

    if (!post) {
      notFound()
    }

    return (
      <PostCard post={post} isAuthenticated={isAuthenticated} showFullText />
    )
  } catch (error) {
    logger.error('Failed to fetch post', error, {
      context: 'PostDetail',
      subreddit,
      postId
    })
    notFound()
  }
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
  try {
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
  } catch (error) {
    logger.error('Failed to fetch comments', error, {
      context: 'CommentList',
      subreddit,
      postId
    })
    return <Title order={4}>Failed to load comments</Title>
  }
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

  const session = await getSession()
  const isAuthenticated = !!session.accessToken

  const [subscriptions, multireddits, avatarUrl] = await Promise.all([
    isAuthenticated ? fetchUserSubscriptions() : Promise.resolve([]),
    isAuthenticated ? fetchMultireddits() : Promise.resolve([]),
    isAuthenticated ? getCurrentUserAvatar() : Promise.resolve(null)
  ])

  return (
    <>
      <PostNavigationTracker currentPostId={postId} />
      <AppLayout
        isAuthenticated={isAuthenticated}
        username={session.username}
        avatarUrl={avatarUrl ?? undefined}
        subscriptions={subscriptions}
        multireddits={multireddits}
      >
        <Container size="lg">
          <Stack gap="xl" maw={800}>
            <ErrorBoundary
              fallback={
                <ErrorDisplay
                  title="Failed to load post"
                  message="Please try again in a moment."
                />
              }
            >
              <Suspense fallback={<PostSkeleton />}>
                <PostDetail subreddit={subreddit} postId={postId} />
              </Suspense>
            </ErrorBoundary>

            <div id="comments" style={{scrollMarginTop: '80px'}}>
              <Title order={3} mb="lg">
                Comments
              </Title>
              <ErrorBoundary
                fallback={
                  <ErrorDisplay
                    title="Failed to load comments"
                    message="Please try again in a moment."
                  />
                }
              >
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
      </AppLayout>
      <SwipeNavigation />
      <BossButton />
      <BackToTop />
    </>
  )
}
