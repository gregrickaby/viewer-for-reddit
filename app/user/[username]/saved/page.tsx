import {AppLayout} from '@/components/layout/AppLayout/AppLayout'
import {PostSkeleton} from '@/components/skeletons/PostSkeleton/PostSkeleton'
import BackToTop from '@/components/ui/BackToTop/BackToTop'
import BossButton from '@/components/ui/BossButton/BossButton'
import {ErrorBoundary} from '@/components/ui/ErrorBoundary/ErrorBoundary'
import {ErrorDisplay} from '@/components/ui/ErrorDisplay/ErrorDisplay'
import {SavedPostsList} from '@/components/ui/SavedPostsList'
import SwipeNavigation from '@/components/ui/SwipeNavigation/SwipeNavigation'
import {
  fetchMultireddits,
  fetchSavedPosts,
  fetchUserSubscriptions,
  getCurrentUserAvatar
} from '@/lib/actions/reddit'
import {getSession} from '@/lib/auth/session'
import {Container, Stack, Text, Title} from '@mantine/core'
import type {Metadata} from 'next'
import {Suspense} from 'react'

interface PageProps {
  params: Promise<{
    username: string
  }>
}

/**
 * Generate metadata for saved posts page.
 */
export async function generateMetadata({
  params
}: Readonly<PageProps>): Promise<Metadata> {
  const {username} = await params

  return {
    title: `${username}'s Saved Posts - Reddit Viewer`,
    description: `View saved posts for Reddit user ${username}`
  }
}

/**
 * Saved posts page for a user.
 * Server Component that fetches initial saved posts and renders SavedPostsList.
 *
 * Features:
 * - Authentication required
 * - Server-side initial data fetch
 * - Client-side infinite scroll
 * - Error boundaries for graceful failure
 * - Loading skeleton
 * - App layout with sidebar navigation
 * - Boss button and back-to-top button
 *
 * @example
 * URL: /user/johndoe/saved
 */
export default async function SavedPostsPage({params}: Readonly<PageProps>) {
  const {username} = await params

  // Check authentication and fetch data
  const session = await getSession()
  const isAuthenticated = !!session.accessToken

  if (!isAuthenticated) {
    return (
      <>
        <AppLayout
          isAuthenticated={false}
          username={undefined}
          avatarUrl={undefined}
          subscriptions={[]}
          multireddits={[]}
        >
          <Container size="lg">
            <Stack align="center" gap="xs" py="xl">
              <Title order={2}>Authentication Required</Title>
              <Text c="dimmed">You must be logged in to view saved posts.</Text>
            </Stack>
          </Container>
        </AppLayout>
        <SwipeNavigation />
        <BossButton />
        <BackToTop />
      </>
    )
  }

  const [subscriptions, multireddits, avatarUrl] = await Promise.all([
    fetchUserSubscriptions(),
    fetchMultireddits(),
    getCurrentUserAvatar()
  ])

  // Fetch initial posts
  try {
    const {posts, after} = await fetchSavedPosts(username)

    if (posts.length === 0) {
      return (
        <>
          <AppLayout
            isAuthenticated={isAuthenticated}
            username={session.username}
            avatarUrl={avatarUrl ?? undefined}
            subscriptions={subscriptions}
            multireddits={multireddits}
          >
            <Container size="lg">
              <Title order={2} mb="md">
                Saved Posts
              </Title>
              <Text c="dimmed">No saved posts yet.</Text>
            </Container>
          </AppLayout>
          <SwipeNavigation />
          <BossButton />
          <BackToTop />
        </>
      )
    }

    return (
      <>
        <AppLayout
          isAuthenticated={isAuthenticated}
          username={session.username}
          avatarUrl={avatarUrl ?? undefined}
          subscriptions={subscriptions}
          multireddits={multireddits}
        >
          <Container size="lg">
            <Title order={2} mb="md">
              Saved Posts
            </Title>
            <ErrorBoundary
              fallback={
                <ErrorDisplay
                  title="Failed to load saved posts"
                  message="Please try again in a moment."
                />
              }
            >
              <Suspense fallback={<PostSkeleton />}>
                <SavedPostsList
                  initialPosts={posts}
                  username={username}
                  initialAfter={after}
                />
              </Suspense>
            </ErrorBoundary>
          </Container>
        </AppLayout>
        <SwipeNavigation />
        <BossButton />
        <BackToTop />
      </>
    )
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to load saved posts'

    return (
      <>
        <AppLayout
          isAuthenticated={isAuthenticated}
          username={session.username}
          avatarUrl={avatarUrl ?? undefined}
          subscriptions={subscriptions}
          multireddits={multireddits}
        >
          <Container size="lg">
            <Stack align="center" gap="xs" py="xl">
              <Title order={2}>Error</Title>
              <Text c="dimmed">{errorMessage}</Text>
            </Stack>
          </Container>
        </AppLayout>
        <SwipeNavigation />
        <BossButton />
        <BackToTop />
      </>
    )
  }
}
