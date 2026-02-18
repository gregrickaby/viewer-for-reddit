'use client'

import {searchSubredditsAndUsers} from '@/lib/actions/reddit'
import type {SearchAutocompleteItem} from '@/lib/types/reddit'
import {logger} from '@/lib/utils/logger'
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
  const [isLoading, setIsLoading] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [debouncedQuery] = useDebouncedValue(query.trim(), DEBOUNCE_DELAY)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Show loading immediately when query is long enough (before debounce fires)
  useEffect(() => {
    if (query.trim().length >= MIN_QUERY_LENGTH) {
      setIsLoading(true)
    } else {
      setIsLoading(false)
      setResults([])
      setHasError(false)
    }
  }, [query])

  useEffect(() => {
    if (debouncedQuery.length < MIN_QUERY_LENGTH) return

    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    const abortController = new AbortController()
    abortControllerRef.current = abortController

    const fetchResults = async () => {
      setIsLoading(true)
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
        logger.error('Multireddit search error', error, {
          context: 'useMultiredditSearch'
        })
        setHasError(true)
        setResults([])
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoading(false)
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
    setIsLoading(false)
  }

  return {query, setQuery, results, isLoading, hasError, clearResults}
}
