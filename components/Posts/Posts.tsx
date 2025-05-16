'use client'

import {Favorite} from '@/components/Favorite/Favorite'
import {PostCard} from '@/components/PostCard/PostCard'
import {useInfinitePosts} from '@/lib/hooks/useInfinitePosts'
import {useTrackRecentSubreddit} from '@/lib/hooks/useTrackRecentSubreddit'
import type {SortingOption} from '@/lib/types'
import {
  Button,
  Code,
  Container,
  Group,
  Loader,
  Stack,
  Title
} from '@mantine/core'
import Link from 'next/link'
import {MdError} from 'react-icons/md'

interface PostsProps {
  subreddit: string
  sort?: SortingOption
}

/**
 * `Posts` Component
 *
 * Displays a list of posts from a specified subreddit, optionally sorted by a given method.
 *
 * @param {string} subreddit - The subreddit to fetch posts from (e.g., "gifs", "pics").
 * @param {SortingOption} [sort='hot'] - Optional sort method ("hot", "new", "top", etc.).
 *
 * @example
 * ```tsx
 * <Posts subreddit="funny" sort="top" />
 * ```
 */
export function Posts({subreddit, sort = 'hot'}: Readonly<PostsProps>) {
  useTrackRecentSubreddit(subreddit)

  const {
    data,
    isLoading,
    isError,
    error,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    ref
  } = useInfinitePosts({subreddit, sort})

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

  return (
    <Container maw={700}>
      <Stack>
        <Group justify="space-between">
          <Title order={2}>{`r/${subreddit}`}</Title>
          <Favorite subreddit={subreddit} />
        </Group>

        {data?.pages.flatMap((page) =>
          (page?.data?.children ?? []).map((post) =>
            post?.data ? <PostCard key={post.data.id} post={post.data} /> : null
          )
        )}

        {hasNextPage && (
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
