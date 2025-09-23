'use client'

import {useAppSelector} from '@/lib/store/hooks'
import {
  useGetUserPostsInfiniteQuery,
  type AutoPostChild
} from '@/lib/store/services/redditApi'
import type {SortingOption} from '@/lib/types'
import {useIntersection} from '@mantine/hooks'
import {useEffect, useMemo} from 'react'

interface InfiniteUserPostsProps {
  username: string
  sort?: SortingOption
}

export function useInfiniteUserPosts({
  username,
  sort = 'new'
}: Readonly<InfiniteUserPostsProps>) {
  const enableNsfw = useAppSelector((state) => state.settings.enableNsfw)
  const query = useGetUserPostsInfiniteQuery({username, sort})
  const {ref, entry} = useIntersection({threshold: 1})

  const {filteredData, noVisiblePosts, wasFiltered} = useMemo(() => {
    if (!query.data)
      return {
        filteredData: undefined,
        noVisiblePosts: false,
        wasFiltered: false
      }

    const filteredPages = query.data.pages.map((page) => {
      const filteredChildren = (page.data?.children ?? []).filter(
        (child: AutoPostChild) => {
          const post = child?.data
          return post && (enableNsfw || !post.over_18)
        }
      )

      return {
        ...page,
        data: {
          ...page.data,
          children: filteredChildren
        }
      }
    })

    const allOriginalCount = query.data.pages.reduce(
      (acc, page) => acc + (page.data?.children?.length ?? 0),
      0
    )

    const allFilteredCount = filteredPages.reduce(
      (acc, page) => acc + (page.data?.children?.length ?? 0),
      0
    )

    return {
      filteredData: {
        ...query.data,
        pages: filteredPages
      },
      noVisiblePosts: allFilteredCount === 0,
      wasFiltered: allOriginalCount > 0 && allFilteredCount === 0
    }
  }, [query.data, enableNsfw])

  useEffect(() => {
    const lastPage = query.data?.pages.at(-1)
    const visiblePosts = lastPage?.data?.children?.some(
      (child: AutoPostChild) => enableNsfw || !child?.data?.over_18
    )

    if (
      entry?.isIntersecting &&
      query.hasNextPage &&
      !query.isFetchingNextPage &&
      visiblePosts
    ) {
      query.fetchNextPage()
    }
  }, [
    entry,
    query.hasNextPage,
    query.isFetchingNextPage,
    query.fetchNextPage,
    query.data,
    enableNsfw
  ])

  return {
    ...query,
    data: filteredData,
    ref,
    noVisiblePosts,
    wasFiltered
  }
}
