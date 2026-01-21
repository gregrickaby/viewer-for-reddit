import {useState} from 'react'

interface Subscription {
  name: string
  displayName: string
  icon?: string
  subscribers?: number
}

interface UseSubscriptionsFilterSortOptions {
  initialSubscriptions: Subscription[]
}

type SortOption = 'default' | 'a-z' | 'z-a'

interface UseSubscriptionsFilterSortReturn {
  searchQuery: string
  setSearchQuery: (query: string) => void
  sortBy: SortOption
  setSortBy: (sort: SortOption) => void
  filteredSubscriptions: Subscription[]
}

/**
 * Custom hook for filtering and sorting user subscriptions.
 * All subscriptions are loaded server-side, this hook provides client-side filtering and sorting.
 * Sorting is optional - default maintains Reddit's original order.
 *
 * @param options - Initial subscriptions (all loaded server-side)
 * @returns Search query, sort option, and filtered/sorted subscriptions
 *
 * @example
 * ```typescript
 * const {searchQuery, setSearchQuery, sortBy, setSortBy, filteredSubscriptions} =
 *   useSubscriptionsFilterSort({
 *     initialSubscriptions: subs
 *   })
 * ```
 */
export function useSubscriptionsFilterSort({
  initialSubscriptions
}: UseSubscriptionsFilterSortOptions): UseSubscriptionsFilterSortReturn {
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('default')

  // Client-side filtering
  const filtered = searchQuery
    ? initialSubscriptions.filter((sub) =>
        sub.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : initialSubscriptions

  // Apply sorting
  const filteredSubscriptions =
    sortBy === 'default'
      ? filtered
      : [...filtered].sort((a, b) => {
          const comparison = a.name
            .toLowerCase()
            .localeCompare(b.name.toLowerCase())
          return sortBy === 'a-z' ? comparison : -comparison
        })

  return {
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    filteredSubscriptions
  }
}
