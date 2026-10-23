'use client'

import type { Route } from 'next'
import Link from 'next/link'
import { Fragment, useEffect, useRef, useState, type ReactNode } from 'react'

import { loadMoreFeed } from '@/app/actions/feed'
import styles from '@/components/feed/feed.module.css'
import { LinkPendingHint } from '@/components/islands/link-pending-hint'
import rows from '@/components/subreddit/subreddit-row.module.css'
import { Button } from '@/components/ui/button'
import { listKind, type MoreFeedRequest } from '@/lib/feed-more'
import { afterHref, PAGE_SIZE, type FeedSort, type HrefQuery } from '@/lib/url-state'

type Status = 'idle' | 'loading' | 'error'

/**
 * Pages appended before the feed hands off to a real next page. Every post stays in the
 * DOM with its decoded images, and a phone runs out of memory long before a desktop does.
 */
export const MAX_PAGES = 7

interface Props {
  request: MoreFeedRequest
  /** The feed's route and default sort, for the next-page link once the cap is reached. */
  base: string
  defaultSort: FeedSort
  /** Other URL state the next-page link keeps, such as `type`, `tab`, or `q`. */
  extra?: HrefQuery
}

/**
 * Appends the next page when the reader nears the end of a feed. The server
 * renders each page (`loadMoreFeed`); this island only watches a sentinel and
 * places what comes back. `request` holds the first cursor and item count. After
 * `MAX_PAGES` it links to the next page, which starts the feed fresh. Without
 * JavaScript the page's Next link works instead.
 */
export function InfiniteFeed({ request, base, defaultSort, extra }: Props) {
  const [pages, setPages] = useState<ReactNode[]>([])
  const [cursor, setCursor] = useState<string | null>(request.after)
  const [status, setStatus] = useState<Status>('idle')
  const sentinel = useRef<HTMLDivElement>(null)
  const seen = request.count + pages.length * PAGE_SIZE
  const full = pages.length >= MAX_PAGES
  const kind = listKind(request.source)
  const appended = pages.map((items, index) => <Fragment key={index}>{items}</Fragment>)

  useEffect(() => {
    const target = sentinel.current
    if (!target || !cursor || full || status !== 'idle') return

    // Loading starts well before the end, so the next page is usually there already.
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return
        observer.disconnect()
        setStatus('loading')
        loadMoreFeed({ ...request, after: cursor, count: seen }).then(
          (result) => {
            if (!result.ok) return setStatus('error')
            setPages((current) => [...current, result.data.items])
            setCursor(result.data.after)
            setStatus('idle')
          },
          // A dropped connection rejects instead of returning an error result.
          () => setStatus('error'),
        )
      },
      { rootMargin: '0px 0px 1000px 0px' },
    )
    observer.observe(target)
    return () => observer.disconnect()
  }, [cursor, full, seen, status, request])

  return (
    <>
      {pages.length === 0 ? null : kind === 'rows' ? (
        <ul className={`${rows.list} ${rows.continued}`} role="list">
          {appended}
        </ul>
      ) : (
        <ol
          className={kind === 'posts' ? `${styles.items} ${styles.posts}` : styles.items}
          role="list"
        >
          {appended}
        </ol>
      )}
      {cursor && full ? (
        <nav aria-label="Pages" className={styles.pagination}>
          <span />
          <Link
            className={styles.pageLink}
            href={afterHref(base, request, cursor, seen, defaultSort, extra) as Route}
            // The same route stays on screen, so Next would keep the reader at the bottom.
            onNavigate={() => window.scrollTo({ top: 0, behavior: 'instant' })}
            rel="next"
          >
            Next page →
            <LinkPendingHint />
          </Link>
        </nav>
      ) : cursor ? (
        <div className={styles.more} ref={sentinel}>
          {status === 'loading' ? <p role="status">Loading more…</p> : null}
          {status === 'error' ? (
            <p role="alert">
              Couldn&apos;t load more.{' '}
              <Button onClick={() => setStatus('idle')} size="sm" variant="secondary">
                Try again
              </Button>
            </p>
          ) : null}
        </div>
      ) : (
        <p className={styles.end}>You&apos;ve reached the end.</p>
      )}
    </>
  )
}
