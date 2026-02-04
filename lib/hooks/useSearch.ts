'use client'

import {searchSubreddits} from '@/lib/actions/reddit'
import type {SubredditItem} from '@/lib/types/reddit'
import {logger} from '@/lib/utils/logger'
import {useDebouncedValue} from '@mantine/hooks'
import {useRouter} from 'next/navigation'
import {useEffect, useRef, useState} from 'react'

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

const DEBOUNCE_DELAY = 300
const MIN_QUERY_LENGTH = 2

/**
 * Hook for typeahead search with Reddit's autocomplete API.
 * Provides live subreddit suggestions grouped by Communities and NSFW.
 *
 * Features:
 * - AbortController to cancel in-flight requests when query changes
 * - Debounced search (300ms) to reduce API calls
 * - Automatic grouping by NSFW status
 * - Error handling with specific messages
 * - Navigation to subreddit or search page
 * - Automatic cleanup on unmount
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
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SubredditItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | undefined>()
  const [debouncedQuery] = useDebouncedValue(query.trim(), DEBOUNCE_DELAY)
  const router = useRouter()
  const abortControllerRef = useRef<AbortController | null>(null)

  // Set loading state immediately when query is long enough (before debounce)
  useEffect(() => {
    if (query.trim().length >= MIN_QUERY_LENGTH) {
      setIsLoading(true)
    } else {
      setIsLoading(false)
      setResults([])
      setHasError(false)
      setErrorMessage(undefined)
    }
  }, [query])

  // Fetch subreddit suggestions from server action
  useEffect(() => {
    const shouldSearch = debouncedQuery.length >= MIN_QUERY_LENGTH

    if (!shouldSearch) {
      return
    }

    // Cancel previous request if still in flight
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Create new abort controller for this request
    const abortController = new AbortController()
    abortControllerRef.current = abortController

    const fetchResults = async () => {
      setIsLoading(true)
      setHasError(false)
      setErrorMessage(undefined)

      try {
        const response = await searchSubreddits(debouncedQuery)

        // Ignore results if request was aborted
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
        // Ignore abort errors
        if (abortController.signal.aborted) {
          return
        }
        // Use logger instead of console.error for production-ready code
        logger.error('Search error', error, {context: 'useSearch'})
        setHasError(true)
        setErrorMessage('Network error. Please try again.')
        setResults([])
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    fetchResults()

    // Cleanup: abort request on unmount or when query changes
    return () => {
      abortController.abort()
    }
  }, [debouncedQuery])

  // Group results by NSFW status
  const communities = results.filter((item) => !item.over18)
  const nsfw = results.filter((item) => item.over18)
  const groupedResults: GroupedResults = {communities, nsfw}

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
