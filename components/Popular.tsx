'use client'

import { IconSpinner } from '@/icons/Spinner'
import { useGetPopularSubredditsInfiniteQuery } from '@/lib/services/publicApi'
import { useEffect } from 'react'
import { useInView } from 'react-intersection-observer'
import { SubredditItem } from './SubredditItem'

/**
 * PopularSubreddits Component.
 */
export function PopularSubreddits() {
  // Fetch popular subreddits.
  const { data, isFetching, fetchNextPage, hasNextPage } =
    useGetPopularSubredditsInfiniteQuery()

  // Track when the end-of-list element comes into view.
  const { ref: endOfListRef, inView } = useInView({
    threshold: 0
  })

  /**
   * Trigger loading of the next page when the last element is in view.
   */
  useEffect(() => {
    if (inView && !isFetching && hasNextPage) {
      fetchNextPage()
    }
  }, [inView, isFetching, hasNextPage, fetchNextPage])

  // Flatten all subreddits from all pages into a single array.
  const allSubreddits = data?.pages.flatMap((page) => page.data.children) || []

  return (
    <>
      {/* Header text */}
      <div className="px-2 py-1 text-sm text-zinc-500">
        Or choose a popular subreddit:
      </div>

      {/* Render each subreddit item.
          Attach the observer to the last item to trigger fetching the next page. */}
      {allSubreddits.map((child, index) => {
        const subreddit = child.data
        // Determine if this is the last item in the list.
        const isLastItem = index === allSubreddits.length - 1

        return (
          <div key={subreddit.id} ref={isLastItem ? endOfListRef : undefined}>
            <SubredditItem
              closeOnSelect={true}
              listType="popular"
              subreddit={subreddit}
            />
          </div>
        )
      })}

      {/* Display a loading spinner when data is being fetched. */}
      {isFetching && (
        <div className="flex justify-center py-4" data-testid="loading-spinner">
          <IconSpinner />
        </div>
      )}
    </>
  )
}
