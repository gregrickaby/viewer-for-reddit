'use client'

import {ErrorMessage} from '@/components/ErrorMessage/ErrorMessage'
import {PostCard} from '@/components/PostCard/PostCard'
import {useAppSelector} from '@/lib/store/hooks'
import {
  type CustomFeedPostsArgs,
  useGetCustomFeedPostsInfiniteQuery
} from '@/lib/store/services/authenticatedApi'
import type {AutoPostChild} from '@/lib/store/services/postsApi'
import type {SortingOption} from '@/lib/types'
import {Box, Loader, Stack, Text} from '@mantine/core'
import {useIntersection} from '@mantine/hooks'
import {useEffect, useMemo} from 'react'

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
 * <CustomFeedPosts username="baxuche" customFeedName="one" sort="hot" />
 */
export function CustomFeedPosts({
  username,
  customFeedName,
  sort = 'hot'
}: Readonly<CustomFeedPostsProps>) {
  const enableNsfw = useAppSelector((state) => state.settings.enableNsfw)
  const queryArgs: CustomFeedPostsArgs = {
    username,
    customFeedName,
    sort
  }

  const query = useGetCustomFeedPostsInfiniteQuery(queryArgs)
  const {ref, entry} = useIntersection({threshold: 1})

  // Filter posts based on NSFW settings
  const filteredData = useMemo(() => {
    if (!query.data) return undefined

    return {
      pages: query.data.pages.map((page) => ({
        ...page,
        data: {
          ...page.data,
          children: (page.data?.children ?? []).filter(
            (child: AutoPostChild) => {
              const post = child?.data
              return post && (enableNsfw || !post.over_18)
            }
          )
        }
      }))
    }
  }, [query.data, enableNsfw])

  // Flatten all posts from all pages
  const allPosts = useMemo(() => {
    return (
      filteredData?.pages.flatMap((page) => page.data?.children ?? []) ?? []
    )
  }, [filteredData])

  // Trigger next page fetch when user scrolls to bottom
  useEffect(() => {
    if (
      entry?.isIntersecting &&
      query.hasNextPage &&
      !query.isFetchingNextPage
    ) {
      query.fetchNextPage()
    }
  }, [entry?.isIntersecting, query])

  // Loading state
  if (query.isLoading) {
    return (
      <Box ta="center" py="xl">
        <Loader size="lg" />
        <Text mt="md">Loading custom feed posts...</Text>
      </Box>
    )
  }

  // Error state
  if (query.isError) {
    return (
      <ErrorMessage
        error={query.error}
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
          <div key={postData.id} ref={isLastPost ? ref : null}>
            <PostCard post={postData} />
          </div>
        )
      })}

      {query.isFetchingNextPage && (
        <Box ta="center" py="md">
          <Loader size="md" />
        </Box>
      )}

      {!query.hasNextPage && allPosts.length > 0 && (
        <Text ta="center" c="dimmed" py="md">
          You've reached the end
        </Text>
      )}
    </Stack>
  )
}
