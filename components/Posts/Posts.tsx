'use client'

import {Favorite} from '@/components/Favorite/Favorite'
import {PostCard} from '@/components/PostCard/PostCard'
import {useInfinitePosts} from '@/lib/hooks/useInfinitePosts'
import {useTrackRecentSubreddit} from '@/lib/hooks/useTrackRecentSubreddit'
import type {SortingOption} from '@/lib/types'
import {Button, Group, Loader, Stack, Title} from '@mantine/core'

interface PostsProps {
  subreddit: string
  sort?: SortingOption
}

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
  } = useInfinitePosts(subreddit, sort)

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
        <Title order={4} c="red">
          Error: {(error as Error).message}
        </Title>
      </Stack>
    )
  }

  return (
    <Stack gap="md">
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
  )
}
