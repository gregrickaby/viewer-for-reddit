import {FeedContainer} from '@/components/layout/FeedContainer/FeedContainer'
import {PostListSkeleton} from '@/components/skeletons/PostSkeleton/PostSkeleton'
import {PostList} from '@/components/ui/PostList/PostList'
import {searchReddit} from '@/lib/actions/reddit/search'
import {generateListingMetadata} from '@/lib/utils/metadata-helpers'
import {Skeleton, Stack, Title} from '@mantine/core'
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

  return generateListingMetadata({
    title: `Search: ${decodedQuery}`,
    description: `Search results for "${decodedQuery}" on Reddit`,
    canonicalUrl: `/search/${query}`
  })
}

/**
 * Search results component - fetches and displays search results.
 *
 * @param params - URL params promise (search query)
 */
async function SearchResults({
  params
}: Readonly<{
  params: PageProps['params']
}>) {
  const {query} = await params
  const decodedQuery = decodeURIComponent(query)

  const {posts, after} = await searchReddit(decodedQuery)

  return (
    <Stack gap="xl">
      <Title order={2}>Search results for: {decodedQuery}</Title>
      {posts.length === 0 ? (
        <Title order={4}>No results found for &quot;{decodedQuery}&quot;</Title>
      ) : (
        <PostList
          initialPosts={posts}
          initialAfter={after}
          searchQuery={decodedQuery}
        />
      )}
    </Stack>
  )
}

/**
 * Search page - displays Reddit search results.
 *
 * @param params - URL params (search query)
 */
export default function SearchPage({params}: Readonly<PageProps>) {
  return (
    <FeedContainer>
      <Suspense
        fallback={
          <Stack gap="xl">
            <Skeleton height={28} width={300} />
            <PostListSkeleton />
          </Stack>
        }
      >
        <SearchResults params={params} />
      </Suspense>
    </FeedContainer>
  )
}
