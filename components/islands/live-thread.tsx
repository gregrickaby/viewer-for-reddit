'use client'

import { createContext, Fragment, type ReactNode, useContext, useRef, useState } from 'react'
import { pollThreadLive } from '@/app/actions/thread-live'
import { usePolling } from '@/components/islands/use-polling'
import { Button } from '@/components/ui/button'
import { plural } from '@/lib/format'
import styles from '@/components/live/live.module.css'

/** Past this scroll offset, new comments wait behind a button instead of pushing the page down. */
const READING_OFFSET = 240

type Cursor = { since: number; seen: string[] }
type Batch = { id: number; items: ReactNode; count: number; shown: boolean }

type Watch = {
  batches: Batch[]
  /** The post's body after an edit, or null while it is the one the page rendered. */
  body: { node: ReactNode } | null
  waiting: number
  showWaiting: () => void
  paused: boolean
  setPaused: (paused: boolean) => void
  gaveUp: boolean
}

const WatchContext = createContext<Watch | null>(null)

type Props = {
  id: string
  cursor: Cursor
  bodyHash: string
  children: ReactNode
}

/**
 * Watches a thread sorted by new. The server renders what a poll finds
 * (`pollThreadLive`); this island decides when to ask, and where the answer goes: new
 * comments into `LiveComments`, an edited post body into `LiveBody`.
 */
export function LiveThread({ id, cursor, bodyHash, children }: Props) {
  const [batches, setBatches] = useState<Batch[]>([])
  const [body, setBody] = useState<Watch['body']>(null)
  const [paused, setPaused] = useState(false)
  const cursorRef = useRef(cursor)
  const hashRef = useRef(bodyHash)
  const batchId = useRef(0)

  const gaveUp = usePolling(async () => {
    const result = await pollThreadLive({
      id,
      cursor: cursorRef.current,
      bodyHash: hashRef.current,
    })
    if (!result.ok) return 'fail'

    const { items, count, cursor: next, bodyHash: nextHash, body: changed } = result.data
    cursorRef.current = next
    hashRef.current = nextHash
    if (changed) setBody(changed)
    if (count === 0 && !changed) return 'idle'
    if (count > 0) {
      const atTop = window.scrollY <= READING_OFFSET
      batchId.current += 1
      const batch = { id: batchId.current, items, count, shown: atTop }
      setBatches((current) => {
        const all = [batch, ...current]
        return atTop ? all.map((each) => ({ ...each, shown: true })) : all
      })
    }
    return 'continue'
  }, !paused)

  const waiting = batches.reduce((total, batch) => total + (batch.shown ? 0 : batch.count), 0)
  const watch: Watch = {
    batches,
    body,
    waiting,
    showWaiting: () => setBatches((current) => current.map((batch) => ({ ...batch, shown: true }))),
    paused,
    setPaused,
    gaveUp,
  }

  return <WatchContext value={watch}>{children}</WatchContext>
}

/** The post's body: what the server rendered, until a poll finds it edited. */
export function LiveBody({ children }: { children: ReactNode }) {
  const watch = useContext(WatchContext)
  return watch?.body ? watch.body.node : children
}

/** The comments that arrived since the page loaded, newest first, with the controls. */
export function LiveComments() {
  const watch = useContext(WatchContext)
  if (!watch) return null
  const { batches, waiting, showWaiting, paused, setPaused, gaveUp } = watch
  const shown = batches.filter((batch) => batch.shown)

  return (
    <div className={styles.watch}>
      <p className={styles.status}>
        <span className={paused ? styles.dotOff : styles.dot} aria-hidden="true" />
        {paused ? 'Not watching for new comments' : 'Watching for new comments'}
        <Button variant="ghost" size="sm" onClick={() => setPaused(!paused)}>
          {paused ? 'Resume' : 'Pause'}
        </Button>
      </p>
      {gaveUp ? (
        <p className={styles.banner} role="alert">
          Couldn’t reach Reddit. Pause and resume to try again.
        </p>
      ) : null}
      {waiting > 0 ? (
        <div className={styles.waiting}>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              showWaiting()
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
          >
            Show {plural(waiting, 'new comment')}
          </Button>
        </div>
      ) : null}
      {shown.length > 0 ? (
        <ol role="list" className={styles.updates}>
          {shown.map((batch) => (
            <Fragment key={batch.id}>{batch.items}</Fragment>
          ))}
        </ol>
      ) : null}
    </div>
  )
}
