'use client'

import { Fragment, type ReactNode, useEffect, useRef, useState } from 'react'
import { loadMoreFeed } from '@/app/actions/feed'
import { Button } from '@/components/ui/button'
import type { MoreFeedRequest } from '@/lib/feed-more'
import { PAGE_SIZE } from '@/lib/url-state'
import styles from '@/components/feed/feed.module.css'

type Status = 'idle' | 'loading' | 'error'

/**
 * Appends the next page when the reader nears the end of a feed. The server
 * renders each page (`loadMoreFeed`); this island only watches a sentinel and
 * places what comes back. `request` holds the first cursor and item count. Without JavaScript the page's Next link works instead.
 */
export function InfiniteFeed({ request }: { request: MoreFeedRequest }) {
  const [pages, setPages] = useState<ReactNode[]>([])
  const [cursor, setCursor] = useState<string | null>(request.after)
  const [status, setStatus] = useState<Status>('idle')
  const seen = useRef(request.count)
  const sentinel = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const target = sentinel.current
    if (!target || !cursor || status !== 'idle') return

    // Loading starts well before the end, so the next page is usually there already.
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return
        observer.disconnect()
        setStatus('loading')
        void loadMoreFeed({ ...request, after: cursor, count: seen.current }).then((result) => {
          if (!result.ok) return setStatus('error')
          seen.current += PAGE_SIZE
          setPages((current) => [...current, result.data.items])
          setCursor(result.data.after)
          setStatus('idle')
        })
      },
      { rootMargin: '0px 0px 1000px 0px' },
    )
    observer.observe(target)
    return () => observer.disconnect()
  }, [cursor, status, request])

  return (
    <>
      {pages.length > 0 ? (
        <ol role="list" className={`${styles.items} ${styles.posts}`}>
          {pages.map((items, index) => (
            <Fragment key={index}>{items}</Fragment>
          ))}
        </ol>
      ) : null}
      {cursor ? (
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
