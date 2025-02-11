import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useInView } from 'react-intersection-observer'
import { IconSpinner } from '../icons/Spinner'
import { toggleAppLoading, toggleSearch } from '../store/features/settingsSlice'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { useGetSubredditPostsQuery } from '../store/services/publicApi'
import { Post } from './Post'

/**
 * Feed Component
 *
 * Main content feed that displays Reddit posts with:
 * - Infinite scrolling
 * - Current post tracking
 * - Loading states
 * - Error handling
 * - Responsive layout
 *
 * Uses intersection observers for:
 * 1. Infinite scroll detection
 * 2. Current post tracking
 */
export function Feed() {
  // Get dispatch function.
  const dispatch = useAppDispatch()

  // Get current feed settings from Redux.
  const { currentSubreddit, currentSort, isAppLoading } = useAppSelector(
    (state) => state.settings
  )

  // Pagination state management.
  const [afterToken, setAfterToken] = useState<string | null>(null)

  // Prevent duplicate loads when scrolling.
  const prevAfterToken = useRef<string | null>(null)

  // Memoize query params to prevent unnecessary refetches.
  const queryParams = useMemo(
    () => ({
      subreddit: currentSubreddit ?? '',
      sort: currentSort,
      after: afterToken ?? ''
    }),
    [currentSubreddit, currentSort, afterToken]
  )

  // Fetch posts with RTK Query.
  const { data, isLoading, isFetching, error, isSuccess } =
    useGetSubredditPostsQuery(queryParams, {
      skip: !currentSubreddit // Don't fetch without a subreddit.
    })

  /**
   * Intersection observer for infinite scrolling.
   *
   * This observer is attached only to the last post.
   */
  const { ref: endOfListRef, inView } = useInView({
    threshold: 0.5, // Trigger when 50% of the element is visible.
    rootMargin: '100px', // Start loading more posts before reaching the end.
    delay: 100 // Delay to prevent rapid-fire requests.
  })

  // Reset pagination when feed source changes.
  useEffect(() => {
    setAfterToken(null)
    prevAfterToken.current = null
  }, [currentSubreddit, currentSort])

  // Handle infinite scroll pagination.
  useEffect(() => {
    const shouldLoadMore =
      inView && // Bottom is visible.
      !isFetching && // Not already loading.
      data?.data.after && // More posts available.
      prevAfterToken.current !== data.data.after // Not a duplicate request.

    if (shouldLoadMore) {
      setAfterToken(data.data.after)
      prevAfterToken.current = data.data.after
    }
  }, [inView, isFetching, data?.data.after])

  // Manage overall app loading state.
  useEffect(() => {
    if (isSuccess && isAppLoading) {
      const timer = setTimeout(() => dispatch(toggleAppLoading()), 300)
      return () => clearTimeout(timer)
    }
  }, [isSuccess, isAppLoading, dispatch])

  // Add state for current post
  const [currentPostId, setCurrentPostId] = useState<string | null>(null)

  /**
   * Callback to attach an IntersectionObserver to each post for current post tracking.
   *
   * When at least 70% of a post is visible, it becomes the current post.
   *
   * Note: The cleanup function returned here is not used by callback refs.
   * If you see memory issues due to observers not being disconnected,
   * consider moving this logic into the Post component or a custom hook.
   *
   * @param node - The DOM node of the post.
   */
  const currentPostObserver = useCallback((node: HTMLElement | null) => {
    if (!node) return

    // Create a new observer for this node.
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.7) {
          // Update the current post id when the post is at least 70% visible.
          const postId = entry.target.getAttribute('data-post-id')
          setCurrentPostId(postId)
        }
      },
      {
        threshold: 0.7 // Require 70% visibility.
      }
    )

    observer.observe(node)

    // Note: The returned cleanup function is ignored by React.
    return () => {
      observer.disconnect()
    }
  }, [])

  /**
   * Reset pagination when the subreddit or sort settings change.
   */
  useEffect(() => {
    setAfterToken(null)
    prevAfterToken.current = null
  }, [currentSubreddit, currentSort])

  /**
   * Trigger pagination when the end-of-list element is in view.
   * Uses the previous "after" token to prevent duplicate requests.
   */
  useEffect(() => {
    if (
      inView &&
      !isFetching &&
      data?.data.after &&
      prevAfterToken.current !== data.data.after
    ) {
      setAfterToken(data.data.after)
      prevAfterToken.current = data.data.after
    }
  }, [inView, isFetching, data?.data.after])

  // Handle loading state based on query status.
  useEffect(() => {
    if (isSuccess && isAppLoading) {
      // Hide loading spinner after successful data fetch.
      const timer = setTimeout(() => {
        dispatch(toggleAppLoading())
      }, 300) // Small delay to prevent flashing.
      return () => clearTimeout(timer)
    }
  }, [isSuccess, isAppLoading, dispatch])

  // Toggle the app loading state when the query status changes.
  useEffect(() => {
    dispatch(toggleAppLoading())
  }, [isSuccess, dispatch])
  return (
    <div className="h-screen snap-y snap-mandatory overflow-x-hidden overflow-y-scroll overscroll-contain">
      {error ? (
        // Render error state.
        <div className="flex h-full items-center justify-center p-4 text-center">
          <p className="text-xl text-black dark:text-white">
            Failed to load posts. Please try again later.
          </p>
        </div>
      ) : isLoading || isAppLoading ? (
        // Render loading spinner during the initial load.
        <div className="flex h-full items-center justify-center">
          <div className="h-10 w-10">
            <IconSpinner height={10} width={10} />
          </div>
        </div>
      ) : isSuccess && !data?.data.children.length ? (
        // Render empty state if no posts are found.
        <div className="flex h-full flex-col items-center justify-center gap-4 p-4 text-center">
          <p className="text-xl text-black dark:text-white">
            No media posts found in r/{currentSubreddit}
          </p>
          <button
            onClick={() => dispatch(toggleSearch())}
            className="rounded bg-blue-500 px-4 py-2 text-white hover:cursor-pointer hover:bg-blue-600"
          >
            Try searching for another subreddit
          </button>
        </div>
      ) : (
        // Render the list of posts.
        <>
          {!!data &&
            data.data.children.map((post, index) => {
              // Determine if this is the last post in the list.
              const isLastPost = index === data.data.children.length - 1

              return (
                <Post
                  key={post.data.id}
                  post={post}
                  isCurrent={post.data.id === currentPostId}
                  /**
                   * Attach two observers:
                   * 1. The infinite scroll observer (attached only to the last post).
                   * 2. The current post observer (attached to every post).
                   *
                   * The Post component should call this ref callback with its DOM node.
                   */
                  observerRef={(node?: Element | null) => {
                    // For infinite scrolling: attach to the last post.
                    if (isLastPost) {
                      endOfListRef(node)
                    }
                    // For current post tracking: attach the observer to every post.
                    if (node) {
                      currentPostObserver(node as HTMLElement)
                    }
                  }}
                />
              )
            })}
          {isFetching && (
            // Render a spinner at the bottom during pagination fetch.
            <div className="flex justify-center p-4">
              <IconSpinner />
            </div>
          )}
        </>
      )}
    </div>
  )
}
