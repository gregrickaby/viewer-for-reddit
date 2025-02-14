import { useEffect, useState } from 'react'
import { useInView } from 'react-intersection-observer'
import { IconSpinner } from '../icons/Spinner'
import { useAppSelector } from '../store/hooks'
import { useGetSubredditPostsQuery } from '../store/services/publicApi'
import { Post } from './Post'
import { ReloadButton } from './ReloadButton'

/**
 * The Feed component fetches and displays posts from the selected subreddit.
 */
export function Feed() {
  // Get the current subreddit, sort, and app loading state from the Redux store.
  const { currentSubreddit, currentSort, isAppLoading } = useAppSelector(
    (state) => state.settings
  )

  // Pagination state.
  const [afterToken, setAfterToken] = useState<string | null>(null)

  // Query posts from the selected subreddit.
  const { data, isLoading, error, isSuccess } = useGetSubredditPostsQuery(
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

  /**
   * Append the next page of posts when the end of the list is reached.
   */
  useEffect(() => {
    if (inView && data?.data.after && afterToken !== data.data.after) {
      setAfterToken(data.data.after)
    }
  }, [inView, data?.data?.after, afterToken])

  {
    /* If there is an error, show an error message with a retry button. */
  }
  if (error || (isSuccess && !data)) {
    console.error('Error in Feed. Failed to load posts:', error)
    return (
      <ReloadButton message="Failed to load posts. Please reload the page." />
    )
  }

  {
    /* If there are no posts, show a message reload buttons. */
  }
  if (isSuccess && !data?.data?.children?.length) {
    return <ReloadButton />
  }

  {
    /* If the data is loading, show a loading spinner. */
  }
  if (isLoading || isAppLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <IconSpinner />
      </div>
    )
  }

  {
    /* Render the posts */
  }
  return (
    <>
      {data?.data?.children?.map((post, index) => {
        const isLastPost = index === data.data.children.length - 1
        return (
          <Post
            key={post.data.id}
            observerRef={isLastPost ? endOfListRef : undefined}
            post={post}
          />
        )
      })}
    </>
  )
}
