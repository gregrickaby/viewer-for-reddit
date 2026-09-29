import type { Route } from 'next'
import Link from 'next/link'
import { useId } from 'react'
import { LinkPendingHint } from '@/components/islands/link-pending-hint'
import {
  type FeedQuery,
  type FeedSort,
  TIME_RANGES,
  type TimeRange,
  sortHref,
  usesTimeRange,
} from '@/lib/url-state'
import styles from './feed.module.css'

const SORT_LABELS: Record<FeedSort, string> = {
  best: 'Best',
  hot: 'Hot',
  new: 'New',
  top: 'Top',
  rising: 'Rising',
}

const RANGE_LABELS: Record<TimeRange, string> = {
  hour: 'Now',
  day: 'Today',
  week: 'This week',
  month: 'This month',
  year: 'This year',
  all: 'All time',
}

/**
 * Sort tabs are links (design §4.1 rule 3). Each carries a `LinkPendingHint`,
 * so the list dims while the next sort loads instead of flashing a skeleton.
 */
export function SortTabs({
  base,
  sorts,
  query,
}: {
  base: string
  sorts: readonly FeedSort[]
  query: FeedQuery
}) {
  const defaultSort = sorts[0]!
  // Unique per instance: Activity keeps earlier routes mounted (hidden) with their own menus.
  const menuId = useId()
  return (
    <div className={styles.toolbar}>
      <nav aria-label="Sort posts" className={styles.tabs}>
        {sorts.map((sort) => (
          <Link
            key={sort}
            href={sortHref(base, sort, query.t, defaultSort) as Route}
            className={styles.tab}
            aria-current={sort === query.sort ? 'page' : undefined}
          >
            {SORT_LABELS[sort]}
            <LinkPendingHint />
          </Link>
        ))}
      </nav>
      {usesTimeRange(query.sort) ? (
        <>
          <button type="button" className={styles.rangeButton} popoverTarget={menuId}>
            {RANGE_LABELS[query.t]}
            <span aria-hidden="true">▾</span>
          </button>
          {/* Keyed by the range: choosing one remounts the menu, so it closes after navigating. */}
          <div key={query.t} id={menuId} popover="auto" className={styles.menu}>
            <ul role="list">
              {TIME_RANGES.map((range) => (
                <li key={range}>
                  <Link
                    href={sortHref(base, query.sort, range, defaultSort) as Route}
                    className={styles.menuItem}
                    aria-current={range === query.t ? 'page' : undefined}
                  >
                    {RANGE_LABELS[range]}
                    <LinkPendingHint />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </>
      ) : null}
    </div>
  )
}

export function SortTabsSkeleton() {
  return (
    <div className={styles.toolbar} aria-hidden="true">
      <span className={`skeleton ${styles.tabsSkeleton}`} />
    </div>
  )
}
