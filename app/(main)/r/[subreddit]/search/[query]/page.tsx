import {PostList} from '@/components/ui/PostList/PostList'
import {searchSubreddit} from '@/lib/actions/reddit'
import {getSession} from '@/lib/auth/session'
import {appConfig} from '@/lib/config/app.config'
import {generateListingMetadata} from '@/lib/utils/metadata-helpers'
import {Anchor, Container, Group, Stack, Text, Title} from '@mantine/core'
import {IconArrowLeft} from '@tabler/icons-react'
import type {Metadata} from 'next'
import Link from 'next/link'

interface PageProps {
  params: Promise<{
    subreddit: string
    query: string
  }>
}

/**
 * Generate metadata for subreddit search page.
 */
export async function generateMetadata({params}: PageProps): Promise<Metadata> {
  const {subreddit, query} = await params
  const decodedQuery = decodeURIComponent(query)

  return generateListingMetadata({
    title: `"${decodedQuery}" in r/${subreddit}`,
    description: `Search results for "${decodedQuery}" in r/${subreddit} with ${appConfig.site.name}.`,
    canonicalUrl: `/r/${subreddit}/search/${query}`,
    index: false
  })
}

/**
 * Search results component - fetches and displays search results.
 *
 * @param subreddit - Subreddit to search within
 * @param query - URL-encoded search query
 * @param isAuthenticated - Whether user is logged in
 */
async function SearchResults({
  subreddit,
  query,
  isAuthenticated
}: Readonly<{
  subreddit: string
  query: string
  isAuthenticated: boolean
}>) {
  const decodedQuery = decodeURIComponent(query)

  const {posts, after} = await searchSubreddit(subreddit, decodedQuery)

  if (posts.length === 0) {
    return (
      <Stack gap="md">
        <Title order={4}>
          No results found for &quot;{decodedQuery}&quot; in r/{subreddit}
        </Title>
        <Text c="dimmed">
          Try a different search term or browse the subreddit.
        </Text>
      </Stack>
    )
  }

  return (
    <PostList
      initialPosts={posts}
      initialAfter={after}
      searchQuery={decodedQuery}
      searchSubreddit={subreddit}
      isAuthenticated={isAuthenticated}
    />
  )
}

/**
 * Subreddit search page - displays search results within a specific subreddit.
 *
 * Features:
 * - Search within specific subreddit
 * - Results with PostList component
 * - Empty state for no results
 * - Back link to subreddit
 * - Boss button and back-to-top button
 *
 * @param params - URL params (subreddit name and search query)
 */
export default async function SubredditSearchPage({
  params
}: Readonly<PageProps>) {
  const {subreddit, query} = await params
  const decodedQuery = decodeURIComponent(query)
  const session = await getSession()
  const isAuthenticated = !!session.accessToken

  return (
    <Container size="lg">
      <Stack gap="xl" maw={800}>
        <Stack gap="sm">
          <Group gap="xs">
            <Anchor
              component={Link}
              href={`/r/${subreddit}`}
              td="none"
              c="dimmed"
              fz="sm"
              data-umami-event="back-to-subreddit"
            >
              <Group gap={4}>
                <IconArrowLeft size={14} />
                Back to r/{subreddit}
              </Group>
            </Anchor>
          </Group>
          <Title order={2}>
            Search results for: &quot;{decodedQuery}&quot;
          </Title>
          <Text c="dimmed" size="sm">
            in r/{subreddit}
          </Text>
        </Stack>

        <SearchResults
          subreddit={subreddit}
          query={query}
          isAuthenticated={isAuthenticated}
        />
      </Stack>
    </Container>
  )
}
