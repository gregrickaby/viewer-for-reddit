import {PostSkeleton} from '@/components/skeletons/PostSkeleton/PostSkeleton'
import {ErrorBoundary} from '@/components/ui/ErrorBoundary/ErrorBoundary'
import {SavedItemsList} from '@/components/ui/SavedItemsList/SavedItemsList'
import {fetchSavedItems} from '@/lib/actions/reddit'
import {getSession} from '@/lib/auth/session'
import {generateListingMetadata} from '@/lib/utils/metadata-helpers'
import {Container, Stack, Text, Title} from '@mantine/core'
import type {Metadata} from 'next'
import {Suspense} from 'react'

interface PageProps {
  params: Promise<{
    username: string
  }>
}

/**
 * Generate metadata for saved items page.
 */
export async function generateMetadata({
  params
}: Readonly<PageProps>): Promise<Metadata> {
  const {username} = await params

  return generateListingMetadata({
    title: `${username}'s Saved`,
    description: `View saved posts and comments for Reddit user ${username}`,
    canonicalUrl: `/user/${username}/saved`,
    index: false
  })
}

/**
 * Saved items page for a user.
 * Server Component that fetches initial saved items and renders SavedItemsList.
 *
 * Features:
 * - Authentication required
 * - Server-side initial data fetch
 * - Client-side infinite scroll
 * - Error boundaries for graceful failure
 * - Loading skeleton
 * - App layout with sidebar navigation
 * - Boss button and back-to-top button
 * - Displays both saved posts and comments
 *
 * @example
 * URL: /user/johndoe/saved
 */
export default async function SavedItemsPage({params}: Readonly<PageProps>) {
  const {username} = await params

  // Check authentication and fetch data
  const session = await getSession()
  const isAuthenticated = !!session.accessToken

  if (!isAuthenticated) {
    return (
      <Container size="lg">
        <Stack align="center" gap="xs" py="xl">
          <Title order={2}>Authentication Required</Title>
          <Text c="dimmed">You must be logged in to view saved items.</Text>
        </Stack>
      </Container>
    )
  }

  // Fetch initial items
  try {
    const {items, after} = await fetchSavedItems(username)

    if (items.length === 0) {
      return (
        <Container size="lg">
          <Title order={2} mb="md">
            Saved
          </Title>
          <Text c="dimmed">No saved items yet.</Text>
        </Container>
      )
    }

    return (
      <Container size="lg">
        <Title order={2} mb="md">
          Saved
        </Title>
        <ErrorBoundary title="Failed to load saved items">
          <Suspense fallback={<PostSkeleton />}>
            <SavedItemsList
              initialItems={items}
              username={username}
              initialAfter={after}
              isAuthenticated={isAuthenticated}
            />
          </Suspense>
        </ErrorBoundary>
      </Container>
    )
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to load saved items'

    return (
      <Container size="lg">
        <Stack align="center" gap="xs" py="xl">
          <Title order={2}>Error</Title>
          <Text c="dimmed">{errorMessage}</Text>
        </Stack>
      </Container>
    )
  }
}
