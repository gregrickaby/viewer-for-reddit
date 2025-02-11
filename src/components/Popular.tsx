import debounce from 'debounce'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useInView } from 'react-intersection-observer'
import { IconSpinner } from '../icons/Spinner'
import { useGetPopularSubredditsQuery } from '../store/services/publicApi'
import { SubredditItem } from './SubredditItem'

/**
 * PopularSubreddits Component
 *
 * This component displays a list of popular subreddits and implements infinite scroll.
 * It uses an IntersectionObserver to detect when the last subreddit item is visible,
 * then it loads the next batch of subreddits. A debounced function prevents rapid,
 * duplicate loading if the observer triggers too frequently.
 *
 * The component assumes that:
 * - The API returns a pagination token in `popularResponse.data.after`.
 * - The API returns an empty or undefined token when there is no more data.
 */
export function PopularSubreddits() {
  // State to store the current pagination token.
  const [afterToken, setAfterToken] = useState<string | null>(null)
  // Reference to the previous pagination token to avoid duplicate requests.
  const prevAfterToken = useRef<string | null>(null)
  // Fetch data using RTK Query.
  const { data: popularResponse, isFetching } = useGetPopularSubredditsQuery({
    after: afterToken ?? undefined
  })

  // Set up the Intersection Observer to track when the end-of-list element comes into view.
  // Using a threshold of 1 ensures the target element is fully visible,
  // and a rootMargin of '100px' triggers the load a bit earlier.
  const { ref: endOfListRef, inView } = useInView({
    threshold: 1,
    rootMargin: '100px'
  })

  /**
   * Debounced function to update the pagination token.
   *
   * This function updates the token only after a 300ms delay,
   * preventing multiple rapid calls when the observer repeatedly triggers.
   *
   * @param {string} newAfter - The new pagination token from the API.
   */
  const debouncedSetAfter = useMemo(
    () =>
      debounce((newAfter: string) => {
        setAfterToken(newAfter)
        prevAfterToken.current = newAfter
      }, 1000),
    []
  )

  // Clean up the debounced function when the component unmounts.
  useEffect(() => {
    return () => {
      debouncedSetAfter.clear()
    }
  }, [debouncedSetAfter])

  /**
   * Effect: Trigger loading of the next page when the last element is in view.
   *
   * The effect checks that:
   * - The last element is in view.
   * - A fetch is not currently in progress.
   * - The API response provides a new pagination token.
   * - The new token is different from the previous token.
   *
   * If all conditions are met, the debounced function is called.
   */
  useEffect(() => {
    if (
      inView &&
      !isFetching &&
      popularResponse?.data.after &&
      prevAfterToken.current !== popularResponse.data.after
    ) {
      debouncedSetAfter(popularResponse.data.after)
    }
  }, [inView, isFetching, popularResponse?.data.after, debouncedSetAfter])

  return (
    <>
      {/* Header text. */}
      <div className="px-2 py-1 text-sm text-zinc-500">
        Or choose a popular subreddit:
      </div>

      {/* Render each subreddit item.
          The observer is attached to the last item. */}
      {(popularResponse?.data.children || []).map((child, index) => {
        const subreddit = child.data
        // Determine if this is the last item in the list.
        const isLastItem =
          index === (popularResponse?.data.children ?? []).length - 1

        return (
          <div key={subreddit.id} ref={isLastItem ? endOfListRef : undefined}>
            <SubredditItem subreddit={subreddit} closeSearchOnSelect={true} />
          </div>
        )
      })}

      {/* Loading spinner displayed when fetching data. */}
      {isFetching && (
        <div className="flex justify-center py-4">
          <IconSpinner />
        </div>
      )}
    </>
  )
}
