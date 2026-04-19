'use client'

import {searchSubredditsAndUsers} from '@/lib/actions/reddit/search'
import {logger} from '@/lib/axiom/client'
import type {SearchAutocompleteItem} from '@/lib/types/reddit'
import {useDebouncedValue} from '@mantine/hooks'
import {useEffect, useRef, useState} from 'react'

const DEBOUNCE_DELAY = 300
const MIN_QUERY_LENGTH = 2

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
 * @returns Query state, results, loading/error state, and a clear function
 */
export function useMultiredditSearch(): UseMultiredditSearchReturn {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchAutocompleteItem[]>([])
  const [isFetching, setIsFetching] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [debouncedQuery] = useDebouncedValue(query.trim(), DEBOUNCE_DELAY)
  const abortControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (debouncedQuery.length < MIN_QUERY_LENGTH) return

    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    const abortController = new AbortController()
    abortControllerRef.current = abortController

    const fetchResults = async () => {
      setIsFetching(true)
      setHasError(false)

      try {
        const response = await searchSubredditsAndUsers(debouncedQuery)

        if (abortController.signal.aborted) return

        if (response.success) {
          setResults(response.data)
          setHasError(false)
        } else {
          setHasError(true)
          setResults([])
        }
      } catch (error) {
        if (abortController.signal.aborted) return
        logger.error('Multireddit search error', {
          error: error instanceof Error ? error.message : String(error),
          context: 'useMultiredditSearch'
        })
        setHasError(true)
        setResults([])
      } finally {
        if (!abortController.signal.aborted) {
          setIsFetching(false)
        }
      }
    }

    fetchResults()

    return () => {
      abortController.abort()
    }
  }, [debouncedQuery])

  const clearResults = () => {
    setQuery('')
    setResults([])
    setHasError(false)
    setIsFetching(false)
  }

  // Derive loading/error/results from query length and fetch state
  const isSearching = query.trim().length >= MIN_QUERY_LENGTH
  const isLoading =
    isSearching && (query.trim() !== debouncedQuery || isFetching)
  const displayResults = isSearching ? results : []

  return {
    query,
    setQuery,
    results: displayResults,
    isLoading,
    hasError: isSearching && hasError,
    clearResults
  }
}
