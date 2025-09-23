'use client'

import {useAppSelector} from '@/lib/store/hooks'
import {
  useGetUserCommentsInfiniteQuery,
  type AutoPostChild
} from '@/lib/store/services/redditApi'
import type {SortingOption} from '@/lib/types'
import {useIntersection} from '@mantine/hooks'
import {useEffect, useMemo} from 'react'

interface InfiniteUserCommentsProps {
  username: string
  sort?: SortingOption
}

export function useInfiniteUserComments({
  username,
  sort = 'new'
}: Readonly<InfiniteUserCommentsProps>) {
  const enableNsfw = useAppSelector((state) => state.settings.enableNsfw)
  const query = useGetUserCommentsInfiniteQuery({username, sort})
  const {ref, entry} = useIntersection({threshold: 1})

  const {filteredData, noVisibleComments, wasFiltered} = useMemo(() => {
    if (!query.data)
      return {
        filteredData: undefined,
        noVisibleComments: false,
        wasFiltered: false
      }

    const filteredPages = query.data.pages.map((page) => {
      const filteredChildren = (page.data?.children ?? []).filter(
        (child: AutoPostChild) => {
          const comment = child?.data
          return comment && (enableNsfw || !comment.over_18)
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
      (total, page) => total + (page.data?.children?.length ?? 0),
      0
    )
    const allFilteredCount = filteredPages.reduce(
      (total, page) => total + (page.data?.children?.length ?? 0),
      0
    )

    return {
      filteredData: {
        ...query.data,
        pages: filteredPages
      },
      noVisibleComments: allFilteredCount === 0 && allOriginalCount > 0,
      wasFiltered: allOriginalCount !== allFilteredCount
    }
  }, [query.data, enableNsfw])

  const allComments = useMemo(() => {
    if (!filteredData) return []
    return filteredData.pages.flatMap((page) => page.data?.children ?? [])
  }, [filteredData])

  // Auto-load next page when scrolling to the sentinel element
  useEffect(() => {
    if (
      entry?.isIntersecting &&
      query.hasNextPage &&
      !query.isFetchingNextPage
    ) {
      void query.fetchNextPage()
    }
  }, [entry?.isIntersecting, query])

  return {
    ...query,
    data: filteredData,
    comments: allComments,
    noVisibleComments,
    wasFiltered,
    loadMoreRef: ref
  }
}
