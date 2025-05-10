'use client'

import {useGetSubredditPostsInfiniteQuery} from '@/lib/store/services/publicApi'
import type {SortingOption} from '@/lib/types'
import {Button, Loader} from '@mantine/core'
import {useEffect} from 'react'
import {useInView} from 'react-intersection-observer'

interface ResultsProps {
  subreddit: string
  sort?: SortingOption
}

export function Results({subreddit, sort = 'hot'}: Readonly<ResultsProps>) {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error
  } = useGetSubredditPostsInfiniteQuery({subreddit, sort})

  const {ref, inView} = useInView({threshold: 1})

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage])

  if (isLoading) return <Loader />
  if (isError) return <p>Error: {(error as Error).message}</p>

  return (
    <div>
      {data?.pages.flatMap((page) =>
        page.data.children.map((post) => (
          <div key={post.data.id}>
            <h2>{post.data.title}</h2>
            <p>{post.data.subreddit_name_prefixed}</p>
          </div>
        ))
      )}

      {hasNextPage && (
        <div ref={ref}>
          {isFetchingNextPage ? (
            <Loader />
          ) : (
            <Button onClick={() => fetchNextPage()}>Load More</Button>
          )}
        </div>
      )}
    </div>
  )
}
