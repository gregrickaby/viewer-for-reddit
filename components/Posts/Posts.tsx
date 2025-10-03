'use client'

import {Favorite} from '@/components/Favorite/Favorite'
import {PostCard} from '@/components/PostCard/PostCard'
import {useInfinitePosts} from '@/lib/hooks/useInfinitePosts'
import {useTrackRecentSubreddit} from '@/lib/hooks/useTrackRecentSubreddit'
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
import {IoHome} from 'react-icons/io5'
import {MdError} from 'react-icons/md'
import styles from './Posts.module.css'

interface PostsProps {
  subreddit: string
  sort?: SortingOption
}

/**
 * Posts component for rendering a paginated, sortable list of Reddit posts for a subreddit.
 *
 * Features:
 * - Fetches posts using useInfinitePosts (RTK Query + infinite scroll)
 * - Supports sorting (Hot, New, Top) via SegmentedControl
 * - Handles loading, error, and empty states with clear UI feedback
 * - Integrates with Favorite, PostCard, and infinite scroll for seamless UX
 * - Tracks recent subreddits for user convenience
 *
 * @param subreddit - The subreddit name to fetch posts from
 * @param sort - The initial sorting option (default: 'hot')
 * @returns JSX.Element for a full subreddit post feed with controls
 */
export function Posts({subreddit, sort = 'hot'}: Readonly<PostsProps>) {
  useTrackRecentSubreddit(subreddit)
  const [selectedSort, setSelectedSort] = useState<SortingOption>(sort)

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
  } = useInfinitePosts({subreddit, sort: selectedSort})

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
          : 'No posts found! Try a different subreddit'}
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
    <Stack>
      <Group mb="md">
        <Link href="/">
          <Group gap="xs" c="red">
            <IoHome />
            <Text size="sm">Home</Text>
          </Group>
        </Link>
        <Text c="dimmed">•</Text>
        <Group gap="xs" c="red">
          <Text size="sm">r/{subreddit}</Text>
        </Group>
      </Group>

      <Group justify="space-between" gap="xs">
        <Group gap="xs" className={styles.header}>
          <Title order={1} size="h2">
            {subreddit === 'all' ? 'Home' : `Posts from r/${subreddit}`}
          </Title>
          <Favorite subreddit={subreddit} />
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
