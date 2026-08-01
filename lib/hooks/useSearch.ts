'use client'

import {searchSubreddits} from '@/lib/actions/reddit/search'
import type {SubredditItem} from '@/lib/types/reddit'
import {useRouter} from 'next/navigation'
import {useDebouncedSearch} from './primitives/useDebouncedSearch'

/**
 * Grouped search results separated by NSFW status.
 */
interface GroupedResults {
  /** SFW subreddits */
  communities: SubredditItem[]
  /** NSFW (18+) subreddits */
  nsfw: SubredditItem[]
}

/**
 * Return type for useSearch hook.
 */
export interface UseSearchReturn {
  /** Current search query */
  query: string
  /** Update search query */
  setQuery: (value: string) => void
  /** Search results grouped by NSFW status */
  groupedResults: GroupedResults
  /** Whether currently loading results */
  isLoading: boolean
  /** Whether an error occurred */
  hasError: boolean
  /** Error message if hasError is true */
  errorMessage?: string
  /** Handle selecting a subreddit from dropdown */
  handleOptionSelect: (value: string) => void
  /** Handle form submission (Enter key) */
  handleSubmit: () => void
}

/**
 * Hook for typeahead search with Reddit's autocomplete API.
 * Provides live subreddit suggestions grouped by Communities and NSFW.
 *
 * Debouncing, in-flight request cancellation, and loading/error state are
 * owned by {@link useDebouncedSearch}.
 *
 * @returns Search state, results, handlers, and error state
 *
 * @example
 * ```typescript
 * const {
 *   query,
 *   setQuery,
 *   groupedResults,
 *   isLoading,
 *   handleOptionSelect,
 *   handleSubmit
 * } = useSearch()
 *
 * <Autocomplete
 *   value={query}
 *   onChange={setQuery}
 *   onOptionSubmit={handleOptionSelect}
 *   data={groupedResults.communities.map(s => s.displayName)}
 *   loading={isLoading}
 * />
 * ```
 */
export function useSearch(): UseSearchReturn {
  const router = useRouter()
  const {query, setQuery, results, isLoading, hasError, errorMessage} =
    useDebouncedSearch<SubredditItem>({
      search: searchSubreddits,
      context: 'useSearch'
    })

  const groupedResults: GroupedResults = {
    communities: results.filter((item) => !item.over18),
    nsfw: results.filter((item) => item.over18)
  }

  // Handle selecting a subreddit from dropdown
  const handleOptionSelect = (value: string) => {
    // Extract subreddit name from value (e.g., "r/pics" -> "pics")
    const subreddit = value.replace(/^r\//, '')
    router.push(`/r/${subreddit}`)
    setQuery('')
  }

  // Handle form submission (Enter key) - navigate to search page
  const handleSubmit = () => {
    if (query.trim().length === 0) return
    router.push(`/search/${encodeURIComponent(query.trim())}`)
    setQuery('')
  }

  return {
    query,
    setQuery,
    groupedResults,
    isLoading,
    hasError,
    errorMessage,
    handleOptionSelect,
    handleSubmit
  }
}
