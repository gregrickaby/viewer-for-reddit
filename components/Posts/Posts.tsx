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
  SegmentedControl,
  Stack,
  Title
} from '@mantine/core'
import Link from 'next/link'
import {useState} from 'react'
import {MdError} from 'react-icons/md'
import styles from './Posts.module.css'

interface PostsProps {
  subreddit: string
  sort?: SortingOption
}

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
      (page?.data?.children ?? []).map((post) =>
        post?.data ? <PostCard key={post.data.id} post={post.data} /> : null
      )
    )
  }

  return (
    <Container maw={700}>
      <Stack>
        <Group justify="space-between" gap="xs">
          <Group gap="xs" className={styles.header}>
            <Title order={1} size="h2">
              Posts from {`r/${subreddit}`}
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
    </Container>
  )
}
