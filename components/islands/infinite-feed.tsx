'use client'

import type { Route } from 'next'
import Link from 'next/link'
import { Fragment, type ReactNode, useEffect, useRef, useState } from 'react'
import { loadMoreFeed } from '@/app/actions/feed'
import { LinkPendingHint } from '@/components/islands/link-pending-hint'
import { Button } from '@/components/ui/button'
import type { MoreFeedRequest } from '@/lib/feed-more'
import { type FeedSort, PAGE_SIZE, afterHref } from '@/lib/url-state'
import styles from '@/components/feed/feed.module.css'

type Status = 'idle' | 'loading' | 'error'

/**
 * Pages appended before the feed hands off to a real next page. Every post stays in the
 * DOM with its decoded images, and a phone runs out of memory long before a desktop does.
 */
export const MAX_PAGES = 7

type Props = {
  request: MoreFeedRequest
  /** The feed's route and default sort, for the next-page link once the cap is reached. */
  base: string
  defaultSort: FeedSort
}

/**
 * Appends the next page when the reader nears the end of a feed. The server
 * renders each page (`loadMoreFeed`); this island only watches a sentinel and
 * places what comes back. `request` holds the first cursor and item count. After
 * `MAX_PAGES` it links to the next page, which starts the feed fresh. Without
 * JavaScript the page's Next link works instead.
 */
export function InfiniteFeed({ request, base, defaultSort }: Props) {
  const [pages, setPages] = useState<ReactNode[]>([])
  const [cursor, setCursor] = useState<string | null>(request.after)
  const [status, setStatus] = useState<Status>('idle')
  const sentinel = useRef<HTMLDivElement>(null)
  const seen = request.count + pages.length * PAGE_SIZE
  const full = pages.length >= MAX_PAGES

  useEffect(() => {
    const target = sentinel.current
    if (!target || !cursor || full || status !== 'idle') return

    // Loading starts well before the end, so the next page is usually there already.
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return
        observer.disconnect()
        setStatus('loading')
        void loadMoreFeed({ ...request, after: cursor, count: seen }).then((result) => {
          if (!result.ok) return setStatus('error')
          setPages((current) => [...current, result.data.items])
          setCursor(result.data.after)
          setStatus('idle')
        })
      },
      { rootMargin: '0px 0px 1000px 0px' },
    )
    observer.observe(target)
    return () => observer.disconnect()
  }, [cursor, full, seen, status, request])

  return (
    <>
      {pages.length > 0 ? (
        <ol role="list" className={`${styles.items} ${styles.posts}`}>
          {pages.map((items, index) => (
            <Fragment key={index}>{items}</Fragment>
          ))}
        </ol>
      ) : null}
      {cursor && full ? (
        <nav aria-label="Pages" className={styles.pagination}>
          <span />
          <Link
            href={afterHref(base, request, cursor, seen, defaultSort) as Route}
            className={styles.pageLink}
            rel="next"
            // The same route stays on screen, so Next would keep the reader at the bottom.
            onNavigate={() => window.scrollTo({ top: 0, behavior: 'instant' })}
          >
            Next page →
            <LinkPendingHint />
          </Link>
        </nav>
      ) : cursor ? (
        <div ref={sentinel} className={styles.more}>
          {status === 'loading' ? <p role="status">Loading more posts…</p> : null}
          {status === 'error' ? (
            <p role="alert">
              Couldn’t load more posts.{' '}
              <Button variant="secondary" size="sm" onClick={() => setStatus('idle')}>
                Try again
              </Button>
            </p>
          ) : null}
        </div>
      ) : (
        <p className={styles.end}>You’ve reached the end.</p>
      )}
    </>
  )
}
