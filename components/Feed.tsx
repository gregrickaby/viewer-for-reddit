'use client'

import { IconSpinner } from '@/icons/Spinner'
import { useAppSelector } from '@/lib/hooks'
import { useGetSubredditPostsInfiniteQuery } from '@/lib/services/publicApi'
import { useEffect } from 'react'
import { useInView } from 'react-intersection-observer'
import { Post } from './Post'
import { ReloadButton } from './ReloadButton'

/**
 * The Feed component fetches and displays posts from the selected subreddit.
 */
export function Feed() {
  // Get the current subreddit and sort from the Redux store.
  const { currentSubreddit, currentSort } = useAppSelector(
    (state) => state.settings
  )

  // Fetch subreddit data.
  const { data, isLoading, error, isSuccess, fetchNextPage, hasNextPage } =
    useGetSubredditPostsInfiniteQuery(
      { subreddit: currentSubreddit ?? '', sort: currentSort },
      { skip: !currentSubreddit }
    )

  // Track when the end-of-list element comes into view.
  const { ref: endOfListRef, inView } = useInView({
    rootMargin: '100px',
    threshold: 0.5
  })

  // When the end of the list is in view and there's another page, fetch it.
  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage()
    }
  }, [inView, hasNextPage, fetchNextPage])

  // Error handling.
  if (error || (isSuccess && !data)) {
    console.error('Error in Feed. Failed to load posts:', error)
    return (
      <ReloadButton message="Failed to load posts. Please reload the page." />
    )
  }

  // If there are no posts, show a reload button.
  if (isSuccess && data?.pages.every((page) => !page.data.children.length)) {
    return <ReloadButton />
  }

  // If the data is loading, show a loading spinner.
  if (isLoading) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2">
        <IconSpinner />
        Loading...
      </div>
    )
  }

  return (
    <>
      {data?.pages.map((page, pageIndex) =>
        page.data.children.map((post, postIndex) => {
          // Determine if this is the last post of the last page.
          const isLastPage = pageIndex === data.pages.length - 1
          const isLastPostInPage = postIndex === page.data.children.length - 1
          const isLastPost = isLastPage && isLastPostInPage

          return (
            <Post
              key={post.data.id}
              observerRef={isLastPost ? endOfListRef : undefined}
              post={post}
            />
          )
        })
      )}
    </>
  )
}
