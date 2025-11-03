'use client'

import {ErrorMessage} from '@/components/UI/ErrorMessage/ErrorMessage'
import {Card} from '@/components/UI/Post/Card/Card'
import {useInfiniteFeed} from '@/lib/hooks/feed/useInfiniteFeed'
import {
  type CustomFeedPostsArgs,
  useGetCustomFeedPostsInfiniteQuery
} from '@/lib/store/services/authenticatedApi'
import type {AutoPostChild} from '@/lib/store/services/postsApi'
import type {SortingOption} from '@/lib/types'
import {Box, Loader, Stack, Text} from '@mantine/core'

interface CustomFeedPostsProps {
  username: string
  customFeedName: string
  sort?: SortingOption
}

/**
 * CustomFeedPosts Component
 *
 * Displays posts from a user's custom feed using authenticated API.
 * Requires user to be logged in as custom feeds are user-specific.
 *
 * Features:
 * - Infinite scroll pagination
 * - Automatic loading states
 * - Error handling with retry
 * - Authentication-aware
 *
 * @example
 * <CustomFeedPosts username="abc123" customFeedName="one" sort="hot" />
 */
export function Custom({
  username,
  customFeedName,
  sort = 'hot'
}: Readonly<CustomFeedPostsProps>) {
  const queryArgs: CustomFeedPostsArgs = {
    username,
    customFeedName,
    sort
  }

  const query = useGetCustomFeedPostsInfiniteQuery(queryArgs)
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
        <Text mt="md">Loading custom feed posts...</Text>
      </Box>
    )
  }

  // Error state
  if (isError) {
    return (
      <ErrorMessage
        error={error}
        type="post"
        resourceName={`${username}/m/${customFeedName}`}
        fallbackUrl={`/u/${username}`}
      />
    )
  }

  // Empty state
  if (!allPosts || allPosts.length === 0) {
    return (
      <Box ta="center" py="xl">
        <Text>No posts found in this custom feed.</Text>
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
