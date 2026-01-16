import {AppLayout} from '@/components/layout/AppLayout/AppLayout'
import {PostSkeleton} from '@/components/skeletons/PostSkeleton/PostSkeleton'
import BackToTop from '@/components/ui/BackToTop/BackToTop'
import BossButton from '@/components/ui/BossButton/BossButton'
import {PostList} from '@/components/ui/PostList/PostList'
import {
  fetchMultireddits,
  fetchUserSubscriptions,
  getCurrentUserAvatar,
  searchReddit
} from '@/lib/actions/reddit'
import {getSession} from '@/lib/auth/session'
import {appConfig} from '@/lib/config/app.config'
import {logger} from '@/lib/utils/logger'
import {Container, Stack, Title} from '@mantine/core'
import type {Metadata} from 'next'
import {Suspense} from 'react'

interface PageProps {
  params: Promise<{
    query: string
  }>
}

/**
 * Generate metadata for search page.
 */
export async function generateMetadata({params}: PageProps): Promise<Metadata> {
  const {query} = await params
  const decodedQuery = decodeURIComponent(query)

  return {
    title: `Search: ${decodedQuery} - ${appConfig.site.name}`,
    description: `Search results for "${decodedQuery}" on Reddit`,
    alternates: {
      canonical: `/search/${query}`
    },
    robots: {
      index: false,
      follow: false
    },
    openGraph: {
      title: `Search: ${decodedQuery} - ${appConfig.site.name}`,
      description: `Search results for "${decodedQuery}" on Reddit`,
      url: `/search/${query}`
    }
  }
}

/**
 * Search results component - fetches and displays search results.
 *
 * @param query - URL-encoded search query
 * @param isAuthenticated - Whether user is logged in
 */
async function SearchResults({
  query,
  isAuthenticated
}: Readonly<{
  query: string
  isAuthenticated: boolean
}>) {
  const decodedQuery = decodeURIComponent(query)

  const searchResult = await searchReddit(decodedQuery).catch((error) => {
    logger.error('Failed to search', error, {context: 'SearchPage', query})
    return {posts: [], after: null}
  })

  const {posts, after} = searchResult

  if (posts.length === 0) {
    return (
      <Title order={4}>No results found for &quot;{decodedQuery}&quot;</Title>
    )
  }

  return (
    <PostList
      initialPosts={posts}
      initialAfter={after}
      searchQuery={decodedQuery}
      isAuthenticated={isAuthenticated}
    />
  )
}

/**
 * Search page - displays Reddit search results.
 *
 * Features:
 * - Search across all of Reddit
 * - Results with PostList component (no infinite scroll)
 * - Empty state for no results
 * - Boss button and back-to-top button
 *
 * @param params - URL params (search query)
 */
export default async function SearchPage({params}: Readonly<PageProps>) {
  const {query} = await params
  const decodedQuery = decodeURIComponent(query)
  const session = await getSession()
  const isAuthenticated = !!session.accessToken

  const [subscriptions, multireddits, avatarUrl] = await Promise.all([
    isAuthenticated ? fetchUserSubscriptions() : Promise.resolve([]),
    isAuthenticated ? fetchMultireddits() : Promise.resolve([]),
    isAuthenticated ? getCurrentUserAvatar() : Promise.resolve(null)
  ])

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
          <Stack gap="xl" style={{maxWidth: '800px'}}>
            <Title order={2}>Search results for: {decodedQuery}</Title>
            <Suspense fallback={<PostSkeleton />}>
              <SearchResults query={query} isAuthenticated={isAuthenticated} />
            </Suspense>
          </Stack>
        </Container>
      </AppLayout>
      <BossButton />
      <BackToTop />
    </>
  )
}
