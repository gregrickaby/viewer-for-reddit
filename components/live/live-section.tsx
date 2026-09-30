import type { Route } from 'next'
import Link from 'next/link'
import { ForbiddenPanel } from '@/components/feed/forbidden-panel'
import { LiveFeed } from '@/components/islands/live-feed'
import { RedditHtml } from '@/components/reddit-html'
import { getLiveEvent, getLiveUpdates } from '@/lib/reddit/live'
import { isLiveCursor } from '@/lib/reddit/names'
import { handleReadError } from '@/lib/reddit/read-errors'
import { requestTime } from '@/lib/request-time'
import type { LiveEventView, LiveUpdateView, Page } from '@/lib/view-models'
import { LiveUpdateItems } from './live-update-items'
import styles from './live.module.css'

export type LiveSectionProps = {
  params: Promise<{ id: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

/**
 * A live thread: its title and notes, then the updates. The first page is rendered
 * here; `LiveFeed` polls for newer ones. `?after=` shows an older page without
 * JavaScript, as plain links, and that view doesn't poll.
 */
export async function LiveSection({ params, searchParams }: LiveSectionProps) {
  const [{ id }, search] = await Promise.all([params, searchParams])
  const after = typeof search.after === 'string' && isLiveCursor(search.after) ? search.after : null

  let event: LiveEventView
  let page: Page<LiveUpdateView>
  try {
    ;[event, page] = await Promise.all([getLiveEvent(id), getLiveUpdates(id, { after })])
  } catch (error) {
    return <ForbiddenPanel reason={handleReadError(error)} />
  }
  const now = await requestTime()
  const items = <LiveUpdateItems updates={page.items} now={now} />

  return (
    <>
      <nav aria-label="Breadcrumb">
        <Link href="/home" className={styles.breadcrumb} transitionTypes={['nav-back']}>
          ← Home
        </Link>
      </nav>

      <header className={styles.header}>
        <h1 className={styles.title}>{event.title}</h1>
        {event.description ? <RedditHtml html={event.description} /> : null}
        {event.resources ? (
          <RedditHtml html={event.resources} className={styles.resources} />
        ) : null}
      </header>

      {after ? (
        <>
          <ol role="list" className={styles.updates}>
            {items}
          </ol>
          <nav aria-label="Pages" className={styles.nav}>
            <Link href={`/live/${id}` as Route}>Latest updates</Link>
            {page.after ? (
              <Link href={`/live/${id}?after=${page.after}` as Route}>Older updates</Link>
            ) : null}
          </nav>
        </>
      ) : (
        <>
          <LiveFeed
            id={id}
            live={event.live}
            viewers={event.viewers}
            newest={page.items[0]?.name ?? null}
            older={page.after}
          >
            {items}
          </LiveFeed>
          <noscript>
            <nav aria-label="Pages" className={styles.nav}>
              <Link href={`/live/${id}` as Route}>Reload for new updates</Link>
              {page.after ? (
                <Link href={`/live/${id}?after=${page.after}` as Route}>Older updates</Link>
              ) : null}
            </nav>
          </noscript>
        </>
      )}
    </>
  )
}

export function LiveSkeleton() {
  return (
    <div className={styles.skeleton}>
      <span className={`skeleton ${styles.titleSkeleton}`} aria-hidden="true" />
      {Array.from({ length: 4 }, (_, index) => (
        <span key={index} className={`skeleton ${styles.updateSkeleton}`} aria-hidden="true" />
      ))}
    </div>
  )
}
