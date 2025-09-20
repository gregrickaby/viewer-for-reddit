'use client'

import {useHeaderState} from '@/lib/hooks/useHeaderState'
import {
  addToSearchHistory,
  clearSingleSearchHistory
} from '@/lib/store/features/settingsSlice'
import {
  selectMobileSearchState,
  selectSearchQuery,
  setMobileSearchState,
  setSearchQuery
} from '@/lib/store/features/transientSlice'
import {useAppDispatch, useAppSelector} from '@/lib/store/hooks'
import {
  useGetPopularSubredditsQuery,
  useSearchSubredditsQuery
} from '@/lib/store/services/redditApi'
import type {SubredditItem} from '@/lib/types'
import {fromSearch} from '@/lib/utils/subredditMapper'
import {useDebouncedValue, useMediaQuery} from '@mantine/hooks'
import {useRouter} from 'next/navigation'
import {useCallback, useEffect, useMemo, useRef} from 'react'

/**
 * Configuration constants for the search feature
 */
const SEARCH_CONFIG = {
  /** Debounce delay in milliseconds to prevent excessive API calls */
  DEBOUNCE_DELAY: 300,
  /** Animation duration for mobile transitions in milliseconds */
  ANIMATION_DURATION: 300,
  /** Focus delay for mobile input to ensure proper rendering */
  FOCUS_DELAY: 100
} as const

export interface GroupedSearchData {
  communities: SubredditItem[]
  nsfw: SubredditItem[]
  searchHistory: SubredditItem[]
}

export interface FilteredGroup {
  label: string
  options: SubredditItem[]
}

/**
 * useSubredditSearch
 *
 * Custom React hook for managing subreddit search logic in the Viewer for Reddit app.
 *
 * Responsibilities:
 * - Handles search query state and debouncing to prevent excessive API calls
 * - Fetches subreddit autocomplete results (search and popular) with proper error handling
 * - Groups results into Communities, NSFW, and Search History for better UX
 * - Provides filtered, grouped options for Combobox UI with proper loading states
 * - Handles option selection (including updating search history and UI state)
 * - Handles removal of individual search history items with event propagation control
 * - Manages mobile-specific UI state with proper cleanup to prevent memory leaks
 * - Returns all handlers and data needed for a presentational search component
 *
 * Performance optimizations:
 * - Debounced API calls to reduce server load
 * - Memoized computations for expensive operations
 * - Conditional queries to avoid unnecessary requests
 * - Proper cleanup of timeouts to prevent memory leaks
 *
 * Usage:
 *   const search = useSubredditSearch()
 *   <Search {...search} />
 */
export function useSubredditSearch(): {
  query: string
  setQuery: (value: string) => void
  autoCompleteData: SubredditItem[]
  groupedData: GroupedSearchData
  filteredGroups: FilteredGroup[]
  totalOptions: number
  isLoading: boolean
  hasError: boolean
  hasNoResults: boolean
  handleOptionSelect: (value: string) => void
  handleRemoveFromHistory: (
    event: React.MouseEvent,
    displayName: string
  ) => void
  isMobile: boolean
  isDropdownOpen: boolean
  handleMobileToggle: () => void
  handleMobileClose: () => void
  handleMobileSearchClick: (combobox: {
    dropdownOpened: boolean
    openDropdown: () => void
    closeDropdown: () => void
  }) => void
  mobileInputRef: React.RefObject<HTMLInputElement | null>
  isClosing: boolean
} {
  const dispatch = useAppDispatch()
  const router = useRouter()
  const query = useAppSelector(selectSearchQuery)
  const trimmedQuery = useMemo(() => query.trim(), [query])
  const [debounced] = useDebouncedValue(
    trimmedQuery,
    SEARCH_CONFIG.DEBOUNCE_DELAY
  )
  const nsfw = useAppSelector((state) => state.settings.enableNsfw)
  const searchHistory = useAppSelector((state) => state.settings.searchHistory)
  const {showNavbar, toggleNavbarHandler} = useHeaderState()

  // Mobile-specific state management using state machine pattern
  const isTabletOrLarger = useMediaQuery('(min-width: 768px)')
  const isMobile = !isTabletOrLarger
  const mobileState = useAppSelector(selectMobileSearchState)
  const mobileInputRef = useRef<HTMLInputElement>(null)

  // Ref to track and cleanup pending timeouts to prevent memory leaks
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Derive boolean states from state machine for backwards compatibility
  const isDropdownOpen = mobileState === 'open' || mobileState === 'opening'
  const isClosing = mobileState === 'closing'

  /**
   * Cleanup function to clear pending timeouts
   * Prevents memory leaks and race conditions from multiple rapid state changes
   */
  const clearPendingTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  /**
   * Clean up timeouts when component unmounts or mobile state changes
   */
  useEffect(() => {
    return clearPendingTimeout
  }, [clearPendingTimeout])

  /**
   * Auto-focus mobile search input when drawer opens
   * Small delay ensures the dropdown is fully rendered before focusing
   */
  useEffect(() => {
    if (isMobile && mobileState === 'open' && mobileInputRef.current) {
      const timer = setTimeout(() => {
        mobileInputRef.current?.focus()
      }, SEARCH_CONFIG.FOCUS_DELAY)
      return () => clearTimeout(timer)
    }
  }, [isMobile, mobileState])

  /**
   * Prevent body scrolling when mobile search drawer is open
   * This improves UX by preventing background scroll behind the overlay
   */
  useEffect(() => {
    if (isMobile) {
      if (mobileState === 'open') {
        // Store original overflow and prevent scrolling
        const originalOverflow = document.body.style.overflow
        document.body.style.overflow = 'hidden'

        return () => {
          // Restore original overflow when drawer closes
          document.body.style.overflow = originalOverflow
        }
      }
      // Ensure body scrolling is restored when not open
      document.body.style.overflow = ''
    }
  }, [isMobile, mobileState])

  /**
   * Shared animation close handler with proper cleanup
   * Manages state transitions and prevents memory leaks
   */
  const closeWithAnimation = useCallback(() => {
    clearPendingTimeout()
    dispatch(setMobileSearchState('closing'))

    timeoutRef.current = setTimeout(() => {
      dispatch(setMobileSearchState('closed'))
      dispatch(setSearchQuery(''))
      timeoutRef.current = null
    }, SEARCH_CONFIG.ANIMATION_DURATION)
  }, [dispatch, clearPendingTimeout])

  const handleMobileToggle = useCallback(() => {
    if (mobileState === 'open') {
      closeWithAnimation()
    } else if (mobileState === 'closed') {
      dispatch(setMobileSearchState('open'))
    }
  }, [mobileState, closeWithAnimation, dispatch])

  const handleMobileClose = useCallback(() => {
    if (mobileState === 'open') {
      closeWithAnimation()
    }
  }, [mobileState, closeWithAnimation])

  const handleMobileSearchClick = useCallback(
    (combobox: {
      dropdownOpened: boolean
      openDropdown: () => void
      closeDropdown: () => void
    }) => {
      if (combobox.dropdownOpened) {
        combobox.closeDropdown()
        handleMobileClose()
      } else {
        combobox.openDropdown()
        handleMobileToggle()
      }
    },
    [handleMobileClose, handleMobileToggle]
  )

  // RTK Query hooks for data fetching with proper error handling
  const {
    data: searchResults = [],
    isLoading: isSearchLoading,
    error: searchError
  } = useSearchSubredditsQuery(
    {query: debounced, enableNsfw: nsfw},
    {skip: debounced.length === 0}
  )

  const {
    data: popularSubreddits = [],
    isLoading: isPopularLoading,
    error: popularError
  } = useGetPopularSubredditsQuery({limit: 10}, {skip: debounced.length > 0})

  /**
   * Calculate loading state with clear logic breakdown
   * Shows loading during debounce period and actual API calls
   */
  const hasActiveQuery = query.trim().length > 0
  const isDebouncing = hasActiveQuery && debounced !== query.trim()
  const isLoading = hasActiveQuery
    ? isDebouncing || isSearchLoading
    : isPopularLoading

  /**
   * Determine if there are any API errors
   * Used to show error states in the UI
   */
  const hasError = Boolean(searchError || popularError)

  /**
   * Transform and combine autocomplete data from API responses
   * Maps search results to internal SubredditItem format
   */
  const autoCompleteData = useMemo<SubredditItem[]>(() => {
    if (debounced.length > 0) {
      return searchResults.map(fromSearch)
    }
    return popularSubreddits
  }, [debounced, searchResults, popularSubreddits])

  /**
   * Group autocomplete data into categories for better UX
   * Separates communities, NSFW content, and search history
   */
  const groupedData = useMemo<GroupedSearchData>(() => {
    const allResults = autoCompleteData
    const communities = allResults.filter((item) => !item.over18)
    const nsfwResults = allResults.filter((item) => item.over18)

    return {
      communities,
      nsfw: nsfwResults,
      // Only show search history when not actively searching
      searchHistory: debounced.length === 0 ? searchHistory : []
    }
  }, [autoCompleteData, searchHistory, debounced.length])

  /**
   * Check if we have completed a search with no results
   * Only show "no results" when not loading and we have an active query but no data
   */
  const hasCompletedSearch = hasActiveQuery && !isLoading && !hasError
  const hasNoResults = hasCompletedSearch && autoCompleteData.length === 0

  /**
   * Handle subreddit selection from dropdown
   * Updates search history, clears search state, closes drawer, and navigates to subreddit
   */
  const handleOptionSelect = useCallback(
    (value: string) => {
      // Find the selected item from our grouped data
      const allItems = [
        ...groupedData.communities,
        ...groupedData.nsfw,
        ...groupedData.searchHistory
      ]
      const item = allItems.find((item) => item.value === value)

      if (item) {
        // 1. Add to search history for future quick access
        dispatch(addToSearchHistory(item))

        // 2. Clear the search query immediately
        dispatch(setSearchQuery(''))

        // 3. Close mobile search drawer immediately (no animation)
        if (isMobile && isDropdownOpen) {
          clearPendingTimeout()
          dispatch(setMobileSearchState('closed'))
          // HOTFIX: Immediately restore body scrolling when closing drawer
          document.body.style.overflow = ''
        }

        // 4. Close navbar if open (mobile UX)
        if (showNavbar) {
          toggleNavbarHandler()
        }

        // 5. Navigate to the selected subreddit
        router.push(`/${item.value}`)
      }
    },
    [
      dispatch,
      router,
      showNavbar,
      toggleNavbarHandler,
      groupedData,
      isMobile,
      isDropdownOpen,
      clearPendingTimeout
    ]
  )

  /**
   * Remove individual item from search history
   * Prevents event bubbling to avoid triggering selection
   */
  const handleRemoveFromHistory = useCallback(
    (event: React.MouseEvent, displayName: string) => {
      event.preventDefault()
      event.stopPropagation()
      dispatch(clearSingleSearchHistory(displayName))
    },
    [dispatch]
  )

  /**
   * Filter and organize groups based on current search query
   * Provides structured data for the Combobox component
   */
  const shouldFilterOptions = query.length > 0
  const filteredGroups = useMemo<FilteredGroup[]>(() => {
    return [
      // Search History - only shown when not actively searching
      ...(groupedData.searchHistory.length > 0 && !shouldFilterOptions
        ? [
            {
              label: 'Search History',
              options: groupedData.searchHistory
            }
          ]
        : []),
      // Communities - filtered by query when searching
      ...(groupedData.communities.length > 0
        ? [
            {
              label: 'Communities',
              options: shouldFilterOptions
                ? groupedData.communities.filter((item) =>
                    item.display_name
                      .toLowerCase()
                      .includes(query.toLowerCase().trim())
                  )
                : groupedData.communities
            }
          ]
        : []),
      // NSFW Communities - filtered by query when searching
      ...(groupedData.nsfw.length > 0
        ? [
            {
              label: 'NSFW',
              options: shouldFilterOptions
                ? groupedData.nsfw.filter((item) =>
                    item.display_name
                      .toLowerCase()
                      .includes(query.toLowerCase().trim())
                  )
                : groupedData.nsfw
            }
          ]
        : [])
    ].filter((group) => group.options.length > 0)
  }, [groupedData, shouldFilterOptions, query])

  /**
   * Calculate total number of available options
   * Used for UI feedback and empty state handling
   */
  const totalOptions = useMemo(() => {
    return filteredGroups.reduce((acc, group) => acc + group.options.length, 0)
  }, [filteredGroups])

  return {
    query,
    setQuery: (value: string) => dispatch(setSearchQuery(value)),
    autoCompleteData,
    groupedData,
    filteredGroups,
    totalOptions,
    handleOptionSelect,
    handleRemoveFromHistory,
    isLoading,
    hasError,
    hasNoResults,
    isMobile,
    isDropdownOpen,
    handleMobileToggle,
    handleMobileClose,
    handleMobileSearchClick,
    mobileInputRef,
    isClosing
  }
}
