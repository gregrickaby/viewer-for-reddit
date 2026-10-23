import type { Route } from 'next'
import Link from 'next/link'
import { useId } from 'react'

import { LinkPendingHint } from '@/components/islands/link-pending-hint'
import {
  sortHref,
  TIME_RANGES,
  usesTimeRange,
  type FeedQuery,
  type FeedSort,
  type HrefQuery,
  type TimeRange,
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
 * Sort tabs are links, so every sort has a URL. Each carries a
 * `LinkPendingHint`, so the list dims while the next sort loads instead of
 * flashing a skeleton.
 */
export function SortTabs({
  base,
  sorts,
  query,
  extra,
}: {
  base: string
  sorts: readonly FeedSort[]
  query: FeedQuery
  /** Other URL state to keep, such as a profile tab. */
  extra?: HrefQuery
}) {
  const defaultSort = sorts[0]!
  // Unique per instance: Activity keeps earlier routes mounted (hidden) with their own menus.
  const menuId = useId()
  return (
    <div className={styles.toolbar}>
      <nav aria-label="Sort posts" className={styles.tabs}>
        {sorts.map((sort) => (
          <Link
            aria-current={sort === query.sort ? 'page' : undefined}
            className={styles.tab}
            href={sortHref(base, sort, query.t, defaultSort, extra) as Route}
            key={sort}
          >
            {SORT_LABELS[sort]}
            <LinkPendingHint />
          </Link>
        ))}
      </nav>
      {usesTimeRange(query.sort) ? (
        <>
          <button className={styles.rangeButton} popoverTarget={menuId} type="button">
            {RANGE_LABELS[query.t]}
            <span aria-hidden="true">▾</span>
          </button>
          {/* Keyed by the range: choosing one remounts the menu, so it closes after navigating. */}
          <div className={styles.menu} id={menuId} key={query.t} popover="auto">
            <ul role="list">
              {TIME_RANGES.map((range) => (
                <li key={range}>
                  <Link
                    aria-current={range === query.t ? 'page' : undefined}
                    className={styles.menuItem}
                    href={sortHref(base, query.sort, range, defaultSort, extra) as Route}
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
    <div aria-hidden="true" className={styles.toolbar}>
      <span className={`skeleton ${styles.tabsSkeleton}`} />
    </div>
  )
}
