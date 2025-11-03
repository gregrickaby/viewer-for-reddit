import {useAppSelector} from '@/lib/store/hooks'
import type {AutoPostChild} from '@/lib/store/services/postsApi'
import {useIntersection} from '@mantine/hooks'
import {useEffect, useMemo} from 'react'

interface UseInfiniteFeedOptions {
  query: {
    data?: {
      pages: Array<{
        data?: {
          children?: AutoPostChild[]
        }
      }>
    }
    isLoading: boolean
    isError: boolean
    error?: unknown
    hasNextPage?: boolean
    isFetchingNextPage?: boolean
    fetchNextPage: () => void
  }
}

/**
 * Custom hook for infinite feed patterns with NSFW filtering
 *
 * Provides common functionality for feed components including:
 * - NSFW filtering based on user settings
 * - Infinite scroll intersection observer
 * - Automatic page fetching
 * - Flattened post data
 *
 * @param query - RTK Query infinite query result
 * @returns Object with filtered posts, loading states, and intersection ref
 */
export function useInfiniteFeed({query}: UseInfiniteFeedOptions) {
  const enableNsfw = useAppSelector((state) => state.settings.enableNsfw)
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

  return {
    allPosts,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    hasNextPage: query.hasNextPage ?? false,
    isFetchingNextPage: query.isFetchingNextPage ?? false,
    intersectionRef: ref
  }
}
