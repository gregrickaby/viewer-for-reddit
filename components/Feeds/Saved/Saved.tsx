'use client'

import {ErrorMessage} from '@/components/UI/ErrorMessage/ErrorMessage'
import {Card} from '@/components/UI/Post/Card/Card'
import {useInfiniteFeed} from '@/lib/hooks/useInfiniteFeed'
import {
  type UserSavedPostsArgs,
  useGetUserSavedPostsInfiniteQuery
} from '@/lib/store/services/authenticatedApi'
import type {AutoPostChild} from '@/lib/store/services/postsApi'
import {Box, Loader, Stack, Text} from '@mantine/core'

interface SavedPostsProps {
  username: string
}

/**
 * Saved Posts Component
 *
 * Displays posts from a user's saved content using authenticated API.
 * Requires user to be logged in as saved posts are user-specific.
 * Filters to posts only (excludes saved comments).
 *
 * Features:
 * - Infinite scroll pagination
 * - Automatic loading states
 * - Error handling with retry
 * - Authentication-aware
 * - NSFW filtering
 *
 * @example
 * <Saved username="testuser" />
 */
export function Saved({username}: Readonly<SavedPostsProps>) {
  const queryArgs: UserSavedPostsArgs = {
    username
  }

  const query = useGetUserSavedPostsInfiniteQuery(queryArgs)
  const {
    allPosts,
    isLoading,
    isError,
    error,
    hasNextPage,
    isFetchingNextPage,
    intersectionRef
  } = useInfiniteFeed({query})

  // Loading state
  if (isLoading) {
    return (
      <Box ta="center" py="xl">
        <Loader size="lg" />
        <Text mt="md">Loading saved posts...</Text>
      </Box>
    )
  }

  // Error state
  if (isError) {
    return (
      <ErrorMessage
        error={error}
        type="post"
        resourceName="saved posts"
        fallbackUrl={`/u/${username}`}
      />
    )
  }

  // Empty state
  if (!allPosts || allPosts.length === 0) {
    return (
      <Box ta="center" py="xl">
        <Text>
          You haven't saved any posts yet. Save posts on Reddit to view them
          here.
        </Text>
      </Box>
    )
  }

  return (
    <Stack>
      {allPosts.map((post: AutoPostChild, index: number) => {
        const isLastPost = index === allPosts.length - 1
        const postData = post.data

        // Skip posts without data
        if (!postData) return null

        return (
          <div key={postData.id} ref={isLastPost ? intersectionRef : null}>
            <Card post={postData} />
          </div>
        )
      })}

      {isFetchingNextPage && (
        <Box ta="center" py="md">
          <Loader size="md" />
        </Box>
      )}

      {!hasNextPage && allPosts.length > 0 && (
        <Text ta="center" c="dimmed" py="md">
          You've reached the end
        </Text>
      )}
    </Stack>
  )
}
