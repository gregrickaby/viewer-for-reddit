'use client'

import {Comments} from '@/components/Comments/Comments'
import {useInfiniteUserComments} from '@/lib/hooks/useInfiniteUserComments'
import type {SortingOption} from '@/lib/types'
import {Button, Center, Group, Loader, Text, Title} from '@mantine/core'
import classes from './UserComments.module.css'

interface UserCommentsProps {
  username: string
  sort: SortingOption
}

export function UserComments({username, sort}: Readonly<UserCommentsProps>) {
  const {
    comments,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    error,
    noVisibleComments,
    wasFiltered,
    loadMoreRef
  } = useInfiniteUserComments({username, sort})

  if (isLoading) {
    return (
      <Group justify="center" mt="lg">
        <Loader />
      </Group>
    )
  }

  if (error) {
    return (
      <Center p="xl">
        <Text c="red">Error loading comments</Text>
      </Center>
    )
  }

  if (noVisibleComments && wasFiltered) {
    return (
      <Center p="xl">
        <Text c="dimmed">
          All comments from this user are NSFW. Enable NSFW content in settings
          to view them.
        </Text>
      </Center>
    )
  }

  if (comments.length === 0) {
    return (
      <Center p="xl">
        <Text c="dimmed">No comments found for this user.</Text>
      </Center>
    )
  }

  return (
    <div className={classes.container}>
      <Group gap="xs">
        <Title order={1} size="h2">
          Comments from u/{username}
        </Title>
      </Group>
      {comments.map((comment) => {
        const commentData = comment?.data
        if (!commentData) return null

        return (
          <Comments
            key={commentData.id}
            comment={commentData}
            showContext
            showScore
          />
        )
      })}

      <div ref={loadMoreRef}>
        {isFetchingNextPage && (
          <Center p="md">
            <Text size="sm" c="dimmed">
              Loading more comments...
            </Text>
          </Center>
        )}
        {!isFetchingNextPage && hasNextPage && (
          <Center p="md">
            <Button
              onClick={() => void fetchNextPage()}
              size="sm"
              variant="subtle"
            >
              Load More Comments
            </Button>
          </Center>
        )}
      </div>
    </div>
  )
}
