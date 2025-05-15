'use client'

import {useGetSubredditPostsInfiniteQuery} from '@/lib/store/services/redditApi'
import type {SortingOption} from '@/lib/types'
import {useIntersection} from '@mantine/hooks'
import {useEffect} from 'react'

interface InfiniteQueryProps {
  subreddit: string
  sort?: SortingOption
}

export function useInfinitePosts({
  subreddit,
  sort = 'hot'
}: Readonly<InfiniteQueryProps>) {
  const query = useGetSubredditPostsInfiniteQuery({subreddit, sort})
  const {ref, entry} = useIntersection({
    threshold: 1
  })

  useEffect(() => {
    if (
      entry?.isIntersecting &&
      query.hasNextPage &&
      !query.isFetchingNextPage
    ) {
      query.fetchNextPage()
    }
  }, [entry, query.hasNextPage, query.isFetchingNextPage, query.fetchNextPage])

  return {
    ...query,
    ref
  }
}
