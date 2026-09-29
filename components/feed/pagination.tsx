import type { Route } from 'next'
import Link from 'next/link'
import { LinkPendingHint } from '@/components/islands/link-pending-hint'
import { type FeedQuery, type FeedSort, nextHref, pageOffset, prevHref } from '@/lib/url-state'
import type { Page, PostView } from '@/lib/view-models'
import styles from './feed.module.css'

/** Previous and Next cursor links (design §8.3). No infinite scroll: that would need client fetching. */
export function Pagination({
  base,
  query,
  page,
  defaultSort,
}: {
  base: string
  query: FeedQuery
  page: Page<PostView>
  defaultSort: FeedSort
}) {
  const first = page.items[0]
  const hasPrevious = pageOffset(query) > 0 && first !== undefined
  if (!hasPrevious && !page.after) {
    return page.items.length > 0 ? <p className={styles.end}>You’ve reached the end.</p> : null
  }

  return (
    <nav aria-label="Pages" className={styles.pagination}>
      {hasPrevious ? (
        <Link
          href={prevHref(base, query, first.fullname, defaultSort) as Route}
          className={styles.pageLink}
          rel="prev"
        >
          ← Previous
          <LinkPendingHint />
        </Link>
      ) : (
        <span />
      )}
      {page.after ? (
        <Link
          href={nextHref(base, query, page.after, defaultSort) as Route}
          className={styles.pageLink}
          rel="next"
        >
          Next →
          <LinkPendingHint />
        </Link>
      ) : null}
    </nav>
  )
}
