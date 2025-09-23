import {PostCard} from '@/components/PostCard/PostCard'
import {useInfinitePosts} from '@/lib/hooks/useInfinitePosts'
import type {AutoPostChild} from '@/lib/store/services/redditApi'
import type {SortingOption} from '@/lib/types'
import {
  Button,
  Code,
  Container,
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
 * @param favorites - Array of favorite subreddit names
 * @param sort - The initial sorting option (default: 'hot')
 */
export function FavoritePosts({
  favorites,
  sort = 'hot'
}: Readonly<FavoritePostsProps>) {
  const [selectedSort, setSelectedSort] = useState<SortingOption>(sort)

  // Combine all favorites into Reddit's multi-subreddit format: r/sub1+sub2+sub3
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
        <Loader data-testid="loader" />
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
        post?.data ? <PostCard key={post.data.id} post={post.data} /> : null
      )
    )
  }

  return (
    <Container maw={700}>
      <Stack>
        <Group justify="space-between" gap="xs">
          <Group gap="xs">
            <MdFavorite size={24} color="var(--mantine-color-red-6)" />
            <Title order={1} size="h2">
              My Feed
            </Title>
            <Text size="sm" c="dimmed">
              {favorites.length} subreddit{favorites.length !== 1 ? 's' : ''}
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
    </Container>
  )
}
