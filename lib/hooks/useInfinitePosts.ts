'use client'

import {useGetSubredditPostsInfiniteQuery} from '@/lib/store/services/publicApi'
import type {SortingOption} from '@/lib/types'
import {useEffect} from 'react'
import {useInView} from 'react-intersection-observer'

export function useInfinitePosts(
  subreddit: string,
  sort: SortingOption = 'hot'
) {
  const query = useGetSubredditPostsInfiniteQuery({subreddit, sort})
  const {ref, inView} = useInView({threshold: 1})

  useEffect(() => {
    if (inView && query.hasNextPage && !query.isFetchingNextPage) {
      query.fetchNextPage()
    }
  }, [inView, query.hasNextPage, query.isFetchingNextPage, query.fetchNextPage])

  return {...query, ref}
}
