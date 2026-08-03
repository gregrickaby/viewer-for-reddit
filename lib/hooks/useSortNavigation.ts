import {useRouter} from 'next/navigation'
import {useTransition} from 'react'

interface UseSortNavigationOptions {
  /** Currently active sort option */
  activeSort: string
  /** Currently active time filter, applied when switching to a sort that supports one */
  activeTimeFilter?: string
  /**
   * Builds the destination href for a sort/time change. Return a falsy
   * value to skip navigation (e.g. when a required param is missing).
   */
  buildHref: (params: {
    sort: string
    time?: string
  }) => string | null | undefined
  /** Options forwarded to `router.push` */
  navigateOptions?: {scroll?: boolean}
}

interface UseSortNavigationReturn {
  isPending: boolean
  handleSortChange: (sort: string) => void
  handleTimeFilterChange: (time: string) => void
}

/**
 * Shared sort/time-filter navigation for tabbed list components (posts, comments).
 * Guards against overlapping transitions and preserves the time filter when
 * switching to a sort that supports one (top, controversial).
 *
 * @param options - Active sort/time state, href builder, and router.push options
 * @returns Pending state and change handlers to wire up to `SortTabs`
 */
export function useSortNavigation({
  activeSort,
  activeTimeFilter,
  buildHref,
  navigateOptions
}: UseSortNavigationOptions): UseSortNavigationReturn {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const navigate = (sort: string, time?: string) => {
    const href = buildHref({sort, time})
    if (!href) return

    startTransition(() => {
      if (navigateOptions) {
        router.push(href, navigateOptions)
      } else {
        router.push(href)
      }
    })
  }

  const handleSortChange = (sort: string) => {
    if (isPending) return // Prevent race conditions

    const time =
      sort === 'top' || sort === 'controversial' ? activeTimeFilter : undefined
    navigate(sort, time)
  }

  const handleTimeFilterChange = (time: string) => {
    if (isPending) return // Prevent race conditions

    navigate(activeSort, time)
  }

  return {isPending, handleSortChange, handleTimeFilterChange}
}
