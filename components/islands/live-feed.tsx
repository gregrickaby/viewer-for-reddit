'use client'

import { Fragment, type ReactNode, useRef, useState } from 'react'
import { loadOlderLive, pollLive } from '@/app/actions/live'
import { usePolling } from '@/components/islands/use-polling'
import { Button } from '@/components/ui/button'
import { plural } from '@/lib/format'
import styles from '@/components/live/live.module.css'

/** The thread is re-read (state, viewers) on every fourth poll, about once a minute. */
const META_EVERY = 4
/** Past this scroll offset, new updates wait behind a button instead of pushing the page down. */
const READING_OFFSET = 240

type Batch = { id: number; items: ReactNode; count: number; shown: boolean }
type Older = 'idle' | 'loading' | 'error'

type Props = {
  id: string
  live: boolean
  viewers: number | null
  /** The newest rendered update's cursor, or null for an empty thread. */
  newest: string | null
  /** The cursor for updates older than the first page. */
  older: string | null
  /** The first page, server-rendered as list items. */
  children: ReactNode
}

/**
 * The updates of a live thread. The server renders every update (`pollLive`,
 * `loadOlderLive`); this island only decides when to ask and where to put the answer.
 * New updates go above the first page, unless the reader has scrolled away from the top.
 */
export function LiveFeed({ id, live, viewers, newest, older, children }: Props) {
  const [batches, setBatches] = useState<Batch[]>([])
  const [olderPages, setOlderPages] = useState<ReactNode[]>([])
  const [cursor, setCursor] = useState<string | null>(older)
  const [olderStatus, setOlderStatus] = useState<Older>('idle')
  const [state, setState] = useState({ live, viewers })
  const newestRef = useRef(newest)
  const batchId = useRef(0)

  const paused = usePolling(async (count) => {
    const result = await pollLive({ id, before: newestRef.current, meta: count % META_EVERY === 0 })
    if (!result.ok) return 'fail'

    const { items, count: added, newest: latest, event } = result.data
    if (added > 0 && latest) {
      newestRef.current = latest
      const atTop = window.scrollY <= READING_OFFSET
      batchId.current += 1
      const batch = { id: batchId.current, items, count: added, shown: atTop }
      setBatches((current) => {
        const next = [batch, ...current]
        return atTop ? next.map((each) => ({ ...each, shown: true })) : next
      })
    }
    if (event) setState(event)
    if (event && !event.live) return 'stop'
    return added > 0 ? 'continue' : 'idle'
  }, state.live)

  const waiting = batches.reduce((total, batch) => total + (batch.shown ? 0 : batch.count), 0)

  async function loadOlder() {
    if (!cursor) return
    setOlderStatus('loading')
    const result = await loadOlderLive({ id, after: cursor })
    if (!result.ok) return setOlderStatus('error')
    setOlderPages((current) => [...current, result.data.items])
    setCursor(result.data.after)
    setOlderStatus('idle')
  }

  return (
    <>
      <p className={styles.status}>
        {state.live ? (
          <>
            <span className={styles.dot} aria-hidden="true" />
            Live
            {state.viewers ? ` · ${plural(state.viewers, 'viewer')}` : null}
          </>
        ) : (
          'This live thread has ended.'
        )}
      </p>
      {paused ? (
        <p className={styles.banner} role="alert">
          Live updates paused. Reload the page to start them again.
        </p>
      ) : null}
      {waiting > 0 ? (
        <div className={styles.waiting}>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setBatches((current) => current.map((batch) => ({ ...batch, shown: true })))
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
          >
            Show {plural(waiting, 'new update')}
          </Button>
        </div>
      ) : null}
      <ol role="list" className={styles.updates}>
        {batches
          .filter((batch) => batch.shown)
          .map((batch) => (
            <Fragment key={batch.id}>{batch.items}</Fragment>
          ))}
        {children}
        {olderPages.map((items, index) => (
          <Fragment key={index}>{items}</Fragment>
        ))}
      </ol>
      {cursor ? (
        <div className={styles.more}>
          <Button variant="secondary" onClick={loadOlder} disabled={olderStatus === 'loading'}>
            {olderStatus === 'loading' ? 'Loading…' : 'Load older updates'}
          </Button>
          {olderStatus === 'error' ? (
            <p role="alert">Couldn’t load older updates. Try again.</p>
          ) : null}
        </div>
      ) : (
        <p className={styles.end}>That’s every update.</p>
      )}
    </>
  )
}
