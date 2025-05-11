'use client'

import {Favorite} from '@/components/Favorite/Favorite'
import {useInfinitePosts} from '@/lib/hooks/useInfinitePosts'
import {useTrackRecentSubreddit} from '@/lib/hooks/useTrackRecentSubreddit'
import type {SortingOption} from '@/lib/types'
import {Button, Loader} from '@mantine/core'

interface PostsProps {
  subreddit: string
  sort?: SortingOption
}

export function Posts({subreddit, sort = 'hot'}: Readonly<PostsProps>) {
  useTrackRecentSubreddit(subreddit)

  const {
    data,
    isLoading,
    isError,
    error,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    ref
  } = useInfinitePosts(subreddit, sort)

  if (isLoading) return <Loader />
  if (isError) return <p>Error: {(error as Error).message}</p>

  return (
    <>
      <h1>
        {`r/${subreddit}`}
        <Favorite subreddit={subreddit} />
      </h1>

      <div>
        {data?.pages.flatMap(
          (page) =>
            page?.data?.children?.map((post) =>
              post?.data ? (
                <div key={post.data.id}>
                  <h2>{post.data.title}</h2>
                  <p>{post.data.subreddit_name_prefixed}</p>
                </div>
              ) : null
            ) ?? []
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
    </>
  )
}
