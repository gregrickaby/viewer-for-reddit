'use client'

import {PostCard} from '@/components/PostCard/PostCard'
import {useInfiniteUserPosts} from '@/lib/hooks/useInfiniteUserPosts'
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
  Title
} from '@mantine/core'
import Link from 'next/link'
import {useState} from 'react'
import {MdError} from 'react-icons/md'
import styles from './UserPosts.module.css'

interface UserPostsProps {
  username: string
  sort?: SortingOption
}

/**
 * UserPosts component.
 *
 * @param username - The Reddit username to fetch posts from
 * @param sort - The initial sorting option (default: 'new')
 * @returns JSX.Element for a full user post feed with controls
 */
export function UserPosts({username, sort = 'new'}: Readonly<UserPostsProps>) {
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
  } = useInfiniteUserPosts({username, sort: selectedSort})

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
          <MdError size={20} /> Unable to load posts from user
        </Title>
        <Code>{JSON.stringify(error, null, 2)}</Code>
        <Button color="gray" component={Link} href="/">
          Go Home
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
          : 'No posts found from this user!'}
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
          <Group gap="xs" className={styles.header}>
            <Title order={1} size="h2">
              Posts from u/{username}
            </Title>
          </Group>
          <SegmentedControl
            value={selectedSort}
            onChange={(value) => setSelectedSort(value as SortingOption)}
            data={[
              {label: 'New', value: 'new'},
              {label: 'Hot', value: 'hot'},
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
