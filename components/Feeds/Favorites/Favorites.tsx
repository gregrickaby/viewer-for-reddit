import {Card} from '@/components/UI/Post/Card/Card'
import {useInfinitePosts} from '@/lib/hooks/feed/useInfinitePosts'
import type {AutoPostChild} from '@/lib/store/services/postsApi'
import type {SortingOption} from '@/lib/types'
import {
  Button,
  Code,
  Group,
  Loader,
  SegmentedControl,
  Stack,
  Text,
  Title
} from '@mantine/core'
import Link from 'next/link'
import {useState} from 'react'
import {MdError, MdFavorite} from 'react-icons/md'

interface FavoritePostsProps {
  favorites: string[]
  sort?: SortingOption
}

/**
 * FavoritePosts component
 *
 * Uses Reddit's custom feeds syntax (r/pics+gaming+funny) to fetch
 * posts from all favorite communities in a single request, then displays
 * them with a unified feed with special "My Feed" header and heart icon.
 *
 * @param favorites - Array of favorite subreddit names
 * @param sort - The initial sorting option (default: 'hot')
 */
export function Favorites({
  favorites,
  sort = 'hot'
}: Readonly<FavoritePostsProps>) {
  const [selectedSort, setSelectedSort] = useState<SortingOption>(sort)

  // Combine all favorites into Reddit's custom feed format: r/sub1+sub2+sub3
  const combinedSubreddits = favorites.length > 0 ? favorites.join('+') : 'all'

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isError,
    isFetchingNextPage,
    isLoading,
    noVisiblePosts,
    ref,
    wasFiltered
  } = useInfinitePosts({subreddit: combinedSubreddits, sort: selectedSort})

  if (isLoading) {
    return (
      <Group justify="center" mt="lg">
        <Loader />
      </Group>
    )
  }

  if (isError) {
    return (
      <Stack align="center" mt="lg">
        <Title order={2} c="red">
          <MdError size={20} /> Unable to load posts from Reddit
        </Title>
        <Code>{JSON.stringify(error, null, 2)}</Code>
        <Button color="gray" component={Link} href="/">
          Reload Page
        </Button>
      </Stack>
    )
  }

  let content = null
  if (noVisiblePosts) {
    content = (
      <Title order={4} ta="center" mt="lg" c="red">
        {wasFiltered
          ? 'You need to enable the "Allow NSFW" setting to see posts'
          : 'No posts found from your favorite subreddits!'}
      </Title>
    )
  } else {
    content = data?.pages.flatMap((page) =>
      (page?.data?.children ?? []).map((post: AutoPostChild) =>
        post?.data ? <Card key={post.data.id} post={post.data} /> : null
      )
    )
  }

  return (
    <Stack>
      <Group justify="space-between" gap="xs">
        <Group gap="xs">
          <MdFavorite size={24} color="var(--mantine-color-red-6)" />
          <Title order={1} size="h2">
            My Feed
          </Title>
          <Text size="sm" c="dimmed">
            {favorites.length} subreddit{favorites.length === 1 ? '' : 's'}
          </Text>
        </Group>
        <SegmentedControl
          value={selectedSort}
          onChange={(value) => setSelectedSort(value as SortingOption)}
          data={[
            {label: 'Hot', value: 'hot'},
            {label: 'New', value: 'new'},
            {label: 'Top', value: 'top'}
          ]}
        />
      </Group>

      {content}

      {hasNextPage && !wasFiltered && (
        <div ref={ref} style={{minHeight: 60}}>
          {isFetchingNextPage ? (
            <Group justify="center">
              <Loader />
            </Group>
          ) : (
            <Button fullWidth onClick={() => fetchNextPage()}>
              Load More
            </Button>
          )}
        </div>
      )}
    </Stack>
  )
}
