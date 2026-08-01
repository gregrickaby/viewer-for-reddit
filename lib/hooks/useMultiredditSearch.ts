'use client'

import {searchSubredditsAndUsers} from '@/lib/actions/reddit/search'
import type {SearchAutocompleteItem} from '@/lib/types/reddit'
import {useDebouncedSearch} from './primitives/useDebouncedSearch'

/**
 * Return type for useMultiredditSearch hook.
 */
export interface UseMultiredditSearchReturn {
  /** Current search query */
  query: string
  /** Update search query */
  setQuery: (value: string) => void
  /** Search results (subreddits and user profiles) */
  results: SearchAutocompleteItem[]
  /** Whether currently loading results */
  isLoading: boolean
  /** Whether an error occurred */
  hasError: boolean
  /** Clear query and results */
  clearResults: () => void
}

/**
 * Hook for typeahead autocomplete in the MultiredditManager.
 * Returns subreddits and user profiles matching the query.
 *
 * Debouncing, in-flight request cancellation, and loading/error state are
 * owned by {@link useDebouncedSearch}.
 *
 * @returns Query state, results, loading/error state, and a clear function
 */
export function useMultiredditSearch(): UseMultiredditSearchReturn {
  const {query, setQuery, results, isLoading, hasError, reset} =
    useDebouncedSearch<SearchAutocompleteItem>({
      search: searchSubredditsAndUsers,
      context: 'useMultiredditSearch'
    })

  return {
    query,
    setQuery,
    results,
    isLoading,
    hasError,
    clearResults: reset
  }
}
