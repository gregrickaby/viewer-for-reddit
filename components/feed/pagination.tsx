import type { Route } from 'next'
import Link from 'next/link'
import { LinkPendingHint } from '@/components/islands/link-pending-hint'
import {
  type FeedQuery,
  type FeedSort,
  type HrefQuery,
  nextHref,
  pageOffset,
  prevHref,
} from '@/lib/url-state'
import styles from './feed.module.css'

export type PaginationProps = {
  base: string
  query: FeedQuery
  /** Reddit's cursor for the next page, if any. */
  after: string | null
  /** The first item's fullname, the cursor for the previous page. */
  firstFullname: string | undefined
  defaultSort: FeedSort
  /** Other URL state to keep, such as `type`, `tab`, or `q`. */
  extra?: HrefQuery
  /** An infinite-scroll island loads the next page, so Next is only for readers without JavaScript. */
  infinite?: boolean
}

/** Previous and Next cursor links (design §8.3). */
export function Pagination({
  base,
  query,
  after,
  firstFullname,
  defaultSort,
  extra,
  infinite = false,
}: PaginationProps) {
  const hasPrevious = pageOffset(query) > 0 && firstFullname !== undefined
  if (!hasPrevious && !after) {
    return firstFullname ? <p className={styles.end}>You’ve reached the end.</p> : null
  }

  const next = after ? (
    <Link
      href={nextHref(base, query, after, defaultSort, extra) as Route}
      className={styles.pageLink}
      rel="next"
    >
      Next →
      <LinkPendingHint />
    </Link>
  ) : null

  const nav = (
    <nav aria-label="Pages" className={styles.pagination}>
      {hasPrevious ? (
        <Link
          href={prevHref(base, query, firstFullname, defaultSort, extra) as Route}
          className={styles.pageLink}
          rel="prev"
        >
          ← Previous
          <LinkPendingHint />
        </Link>
      ) : (
        <span />
      )}
      {infinite ? <noscript>{next}</noscript> : next}
    </nav>
  )
  // With no Previous link, a script-enabled reader has nothing to show here.
  return infinite && !hasPrevious ? <noscript>{nav}</noscript> : nav
}
