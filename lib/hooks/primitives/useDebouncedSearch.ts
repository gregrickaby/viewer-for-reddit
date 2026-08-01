'use client'

import {logger} from '@/lib/datadog/client'
import {getErrorMessage} from '@/lib/utils/errors'
import {useDebouncedValue} from '@mantine/hooks'
import {useEffect, useRef, useState} from 'react'

const DEBOUNCE_DELAY = 300
const MIN_QUERY_LENGTH = 2

interface SearchResult<T> {
  success: boolean
  data: T[]
  error?: string
}

interface UseDebouncedSearchOptions<T> {
  /** Server Action that performs the search for a given query. */
  search: (query: string) => Promise<SearchResult<T>>
  /** Logging context, distinguishes call sites in Datadog. */
  context: string
}

interface UseDebouncedSearchReturn<T> {
  /** Current search query. */
  query: string
  /** Update search query. */
  setQuery: (value: string) => void
  /** Search results for the current query (empty until MIN_QUERY_LENGTH is met). */
  results: T[]
  /** Whether currently loading results. */
  isLoading: boolean
  /** Whether an error occurred. */
  hasError: boolean
  /** Error message if hasError is true. */
  errorMessage?: string
  /** Clears query, results, and error state. */
  reset: () => void
}

/**
 * Primitive for typeahead search: debounces the query, cancels in-flight
 * requests via AbortController when the query changes, and derives
 * loading/error/results state from query length and fetch status.
 *
 * @param options.search - Server Action that performs the search
 * @param options.context - Logging context for the calling hook
 * @returns Query state, results, loading/error state, and a reset function
 */
export function useDebouncedSearch<T>({
  search,
  context
}: UseDebouncedSearchOptions<T>): UseDebouncedSearchReturn<T> {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<T[]>([])
  const [isFetching, setIsFetching] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | undefined>()
  const [debouncedQuery] = useDebouncedValue(query.trim(), DEBOUNCE_DELAY)
  const abortControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (debouncedQuery.length < MIN_QUERY_LENGTH) {
      return
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    const abortController = new AbortController()
    abortControllerRef.current = abortController

    const fetchResults = async () => {
      setIsFetching(true)
      setHasError(false)
      setErrorMessage(undefined)

      try {
        const response = await search(debouncedQuery)

        if (abortController.signal.aborted) {
          return
        }

        if (response.success) {
          setResults(response.data)
          setHasError(false)
          setErrorMessage(undefined)
        } else {
          setHasError(true)
          setErrorMessage(response.error || 'Search failed')
          setResults([])
        }
      } catch (error) {
        if (abortController.signal.aborted) {
          return
        }
        logger.error('Search error', {error: getErrorMessage(error), context})
        setHasError(true)
        setErrorMessage('Network error. Please try again.')
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
  }, [debouncedQuery, search, context])

  const isSearching = query.trim().length >= MIN_QUERY_LENGTH
  const isLoading =
    isSearching && (query.trim() !== debouncedQuery || isFetching)
  const displayHasError = isSearching && hasError

  const reset = () => {
    setQuery('')
    setResults([])
    setHasError(false)
    setErrorMessage(undefined)
    setIsFetching(false)
  }

  return {
    query,
    setQuery,
    results: isSearching ? results : [],
    isLoading,
    hasError: displayHasError,
    errorMessage: displayHasError ? errorMessage : undefined,
    reset
  }
}
