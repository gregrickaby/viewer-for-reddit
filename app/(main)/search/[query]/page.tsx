import {PostList} from '@/components/ui/PostList/PostList'
import {searchReddit} from '@/lib/actions/reddit'
import {getSession} from '@/lib/auth/session'
import {generateListingMetadata} from '@/lib/utils/metadata-helpers'
import {Container, Stack, Title} from '@mantine/core'
import type {Metadata} from 'next'

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

  return generateListingMetadata({
    title: `Search: ${decodedQuery}`,
    description: `Search results for "${decodedQuery}" on Reddit`,
    canonicalUrl: `/search/${query}`
  })
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

  const {posts, after} = await searchReddit(decodedQuery)

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

  return (
    <Container size="lg">
      <Stack gap="xl" maw={800}>
        <Title order={2}>Search results for: {decodedQuery}</Title>
        <SearchResults query={query} isAuthenticated={isAuthenticated} />
      </Stack>
    </Container>
  )
}
