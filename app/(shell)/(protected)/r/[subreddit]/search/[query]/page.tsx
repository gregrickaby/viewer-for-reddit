import {TabsSkeleton} from '@/components/skeletons/TabsSkeleton/TabsSkeleton'
import {PostList} from '@/components/ui/PostList/PostList'
import {searchSubreddit} from '@/lib/actions/reddit/search'
import {appConfig} from '@/lib/config/app.config'
import {generateListingMetadata} from '@/lib/utils/metadata-helpers'
import {Container, Stack, Text, Title} from '@mantine/core'
import type {Metadata} from 'next'
import {Suspense} from 'react'
import {BackToSubreddit} from './BackToSubreddit'

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
 * @param params - URL params promise (subreddit name and search query)
 */
async function SearchResults({
  params
}: Readonly<{
  params: PageProps['params']
}>) {
  const {subreddit, query} = await params
  const decodedQuery = decodeURIComponent(query)

  const {posts, after} = await searchSubreddit(subreddit, decodedQuery)

  return (
    <Stack gap="xl" maw={800} mx="auto">
      <Stack gap="sm">
        <BackToSubreddit subreddit={subreddit} />
        <Title order={2}>Search results for: &quot;{decodedQuery}&quot;</Title>
        <Text c="dimmed" size="sm">
          in r/{subreddit}
        </Text>
      </Stack>

      {posts.length === 0 ? (
        <Stack gap="md">
          <Title order={4}>
            No results found for &quot;{decodedQuery}&quot; in r/{subreddit}
          </Title>
          <Text c="dimmed">
            Try a different search term or browse the subreddit.
          </Text>
        </Stack>
      ) : (
        <PostList
          initialPosts={posts}
          initialAfter={after}
          searchQuery={decodedQuery}
          searchSubreddit={subreddit}
        />
      )}
    </Stack>
  )
}

/**
 * Subreddit search page - displays search results within a specific subreddit.
 *
 * @param params - URL params (subreddit name and search query)
 */
export default function SubredditSearchPage({params}: Readonly<PageProps>) {
  return (
    <Container size="lg">
      <Suspense fallback={<TabsSkeleton />}>
        <SearchResults params={params} />
      </Suspense>
    </Container>
  )
}
