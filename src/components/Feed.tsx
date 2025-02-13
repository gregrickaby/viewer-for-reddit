import { useEffect, useState } from 'react'
import { useInView } from 'react-intersection-observer'
import { IconSpinner } from '../icons/Spinner'
import { toggleAppLoading } from '../store/features/settingsSlice'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { useGetSubredditPostsQuery } from '../store/services/publicApi'
import { Post } from './Post'

/**
 * The Feed component fetches and displays posts from the selected subreddit.
 */
export function Feed() {
  // Get the dispatch function from the Redux store.
  const dispatch = useAppDispatch()

  // Get the current subreddit, sort, and app loading state from the Redux store.
  const { currentSubreddit, currentSort, isAppLoading } = useAppSelector(
    (state) => state.settings
  )

  // Pagination state.
  const [afterToken, setAfterToken] = useState<string | null>(null)

  // Query posts with refetch function.
  const { data, isLoading, isFetching, error, refetch } =
    useGetSubredditPostsQuery(
      {
        subreddit: currentSubreddit ?? '',
        sort: currentSort,
        after: afterToken ?? ''
      },
      { skip: !currentSubreddit }
    )

  // Infinite scroll observer.
  const { ref: endOfListRef, inView } = useInView({
    rootMargin: '100px',
    threshold: 0.5
  })

  // Append new posts when scrolled to the bottom.
  useEffect(() => {
    if (inView && data?.data.after) {
      setAfterToken(data.data.after)
    }
  }, [inView, data?.data.after])

  // Manage app loading state.
  useEffect(() => {
    if (isAppLoading && !isFetching) {
      const timer = setTimeout(() => dispatch(toggleAppLoading()), 300)
      return () => clearTimeout(timer)
    }
  }, [isAppLoading, isFetching, dispatch])

  {
    /* If there is an error, show an error message with a retry button. */
  }
  if (error) {
    return (
      <div className="flex h-full items-center justify-center p-4 text-center">
        <p className="text-xl text-black dark:text-white">
          Failed to load posts. Please try again.
        </p>
        <button
          onClick={() => refetch()}
          className="mt-4 rounded bg-blue-500 px-4 py-2 text-white hover:cursor-pointer hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    )
  }

  {
    /* If the data is loading, show a loading spinner. */
  }
  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <IconSpinner />
      </div>
    )
  }

  {
    /* If there are no posts, show a message with retry and reload buttons. */
  }
  if (!data?.data.children.length) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-4 text-center">
        <p className="max-w-60 text-xl">
          Whoops! Please try again or reload the page to start fresh.
        </p>
        <div className="flex gap-4">
          <button
            onClick={() => refetch()}
            className="rounded bg-blue-500 px-4 py-2 text-white hover:cursor-pointer hover:bg-blue-600"
          >
            Retry
          </button>
          <button
            onClick={() => window.location.reload()}
            className="rounded bg-gray-500 px-4 py-2 text-white hover:cursor-pointer hover:bg-gray-600"
          >
            Reload Page
          </button>
        </div>
      </div>
    )
  }

  {
    /* Render the posts and a loading spinner at the end of the list. */
  }
  return (
    <div className="h-screen snap-y snap-mandatory overflow-x-hidden overflow-y-scroll overscroll-contain">
      {data.data.children.map((post, index) => {
        const isLastPost = index === data.data.children.length - 1
        return (
          <Post
            key={post.data.id}
            observerRef={isLastPost ? endOfListRef : undefined}
            post={post}
          />
        )
      })}

      {/* Show a loading spinner at the end of the list during infinite scroll. */}
      {isFetching && (
        <div className="flex justify-center p-4">
          <IconSpinner />
        </div>
      )}
    </div>
  )
}
