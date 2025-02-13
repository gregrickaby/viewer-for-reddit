import debounce from 'debounce'
import { ChangeEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { IconSpinner } from '../icons/Spinner'
import { useAppSelector } from '../store/hooks'
import { useSearchSubredditsQuery } from '../store/services/privateApi'
import { PopularSubreddits } from './Popular'
import { SubredditItem } from './SubredditItem'

/**
 * Search component.
 */
export function Search() {
  // Set local state for search query and debounced query.
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')

  // Get enableNsfw setting from the store.
  const enableNsfw = useAppSelector((state) => state.settings.enableNsfw)

  // Debounce the query to prevent too many requests.
  const debouncedSetQuery = useMemo(
    () => debounce((value: string) => setDebouncedQuery(value), 300),
    []
  )

  /**
   * Clear the debounced query when the component is unmounted.
   */
  useEffect(() => {
    return () => {
      debouncedSetQuery.clear()
    }
  }, [debouncedSetQuery])

  // Fetch subreddits based on the debounced query.
  const {
    data: results = [],
    isFetching,
    isSuccess,
    isError
  } = useSearchSubredditsQuery(
    { query: debouncedQuery, enableNsfw },
    { skip: debouncedQuery.length < 3 }
  )

  /**
   * Handle search input change.
   */
  const handleSearchInput = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      // Get the trimmed value from the input.
      const value = e.target.value.trim()

      // Set the query value.
      setQuery(value)

      // Debounce the query.
      debouncedSetQuery(value)

      // If the input is cleared, reset the debounced query.
      if (value === '') {
        setDebouncedQuery('')
      }
    },
    [debouncedSetQuery]
  )

  // Helper to determine if search is active
  const isSearching = debouncedQuery.length >= 3

  return (
    <>
      <div className="relative">
        {/* Search input. */}
        <input
          aria-label="Search subreddits"
          autoCapitalize="none"
          autoComplete="off"
          autoCorrect="off"
          autoFocus
          className="w-full rounded border p-3 pr-8 outline-none focus:border-zinc-400 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white dark:focus:border-zinc-500"
          enterKeyHint="search"
          onChange={handleSearchInput}
          placeholder="Search subreddits..."
          spellCheck={false}
          type="search"
          value={query}
        />

        {/* Spinner icon when fetching search results. */}
        <div className="absolute top-1/2 right-2 -translate-y-1/2">
          {isFetching && <IconSpinner />}
        </div>
      </div>

      <div className="mt-2 max-h-[45vh] space-y-1 overflow-y-auto overscroll-contain lg:max-h-[38vh]">
        {debouncedQuery.length > 0 && debouncedQuery.length < 3 ? (
          <div className="p-4 text-center text-sm text-zinc-500">
            Please enter at least 3 characters to search
          </div>
        ) : isSearching ? (
          <>
            {isFetching ? (
              <div className="p-4 text-center text-sm text-zinc-500">
                Searching subreddits...
              </div>
            ) : isError ? (
              <div className="p-4 text-center text-sm text-zinc-500">
                Failed to fetch subreddits. Please try again.
              </div>
            ) : isSuccess && results.length === 0 ? (
              <div className="p-4 text-center text-sm text-zinc-500">
                No subreddits found. Try searching again.
              </div>
            ) : (
              results.map((subreddit) => (
                <SubredditItem key={subreddit.id} subreddit={subreddit} />
              ))
            )}
          </>
        ) : (
          <PopularSubreddits />
        )}
      </div>
    </>
  )
}
