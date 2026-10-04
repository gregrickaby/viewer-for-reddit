'use client'

import {
  createContext,
  Fragment,
  type ReactNode,
  useContext,
  useLayoutEffect,
  startTransition,
  useEffect,
  useRef,
  useState,
} from 'react'
import { type LiveItem, pollThreadLive } from '@/app/actions/thread-live'
import { POLL_MS, usePolling } from '@/components/islands/use-polling'
import { Button } from '@/components/ui/button'
import { compactNumber, plural } from '@/lib/format'
import styles from '@/components/live/live.module.css'

/** Past this scroll offset, the reader is mid-page: new comments must not move what they see. */
const READING_OFFSET = 240

/** How long one poll's comments take to play out: most of the wait for the next poll. */
const SPREAD_MS = POLL_MS * 0.8
/** The most time between two comments posted in the same second. */
const MAX_GAP_MS = 400

type Cursor = { since: number; seen: string[] }

/**
 * When to show each of a poll's comments (oldest first), in ms from the first. They keep
 * the gaps they were posted with, squeezed to fit `SPREAD_MS`, so a busy thread reads as
 * a stream instead of a block every poll.
 */
export function paceComments(items: LiveItem[]): number[] {
  const first = items[0]?.createdUtc ?? 0
  const last = items.at(-1)?.createdUtc ?? 0
  const span = (last - first) * 1000
  const scale = span > SPREAD_MS ? SPREAD_MS / span : 1
  const gap = Math.min(MAX_GAP_MS, SPREAD_MS / items.length)
  let previous = -gap
  return items.map((item) => {
    previous = Math.max((item.createdUtc - first) * 1000 * scale, previous + gap)
    return previous
  })
}

type Watch = {
  /** The comments shown so far, newest first. */
  comments: LiveItem[]
  /** The post's body after an edit, or null while it is the one the page rendered. */
  body: { node: ReactNode } | null
  /** Reddit's comment total from the latest poll, or null before the first one. */
  numComments: number | null
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
  const [comments, setComments] = useState<LiveItem[]>([])
  const [body, setBody] = useState<Watch['body']>(null)
  const [paused, setPaused] = useState(false)
  const [numComments, setNumComments] = useState<number | null>(null)
  const cursorRef = useRef(cursor)
  const hashRef = useRef(bodyHash)
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>())
  /** When the comments already queued finish playing. */
  const queuedUntil = useRef(0)

  useEffect(() => {
    const pending = timers.current
    return () => {
      for (const timer of pending) clearTimeout(timer)
    }
  }, [])

  const play = (items: LiveItem[]) => {
    const oldestFirst = items.toReversed()
    const start = Math.max(Date.now(), queuedUntil.current)
    const delays = paceComments(oldestFirst)
    queuedUntil.current = start + (delays.at(-1) ?? 0)
    oldestFirst.forEach((item, index) => {
      // A transition lets the comment's ViewTransition play instead of popping in.
      const show = () => startTransition(() => setComments((current) => [item, ...current]))
      const delay = start - Date.now() + (delays[index] ?? 0)
      if (delay <= 0) return show()
      const timer = setTimeout(() => {
        timers.current.delete(timer)
        show()
      }, delay)
      timers.current.add(timer)
    })
  }

  const gaveUp = usePolling(async () => {
    const result = await pollThreadLive({
      id,
      cursor: cursorRef.current,
      bodyHash: hashRef.current,
    })
    if (!result.ok) return 'fail'

    const {
      items,
      cursor: next,
      bodyHash: nextHash,
      body: changed,
      numComments: total,
    } = result.data
    setNumComments(total)
    cursorRef.current = next
    hashRef.current = nextHash
    if (changed) setBody(changed)
    if (items.length === 0 && !changed) return 'idle'
    if (items.length > 0) play(items)
    return 'continue'
  }, !paused)

  const watch: Watch = {
    comments,
    body,
    numComments,
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

/**
 * The thread's comment count: what the page rendered, then Reddit's total from each
 * poll. With `hiddenClass` the noun is a span that class can hide on narrow screens.
 */
export function LiveCount({
  initial,
  noun,
  hiddenClass,
}: {
  initial: number
  noun: string
  hiddenClass?: string
}) {
  const count = useContext(WatchContext)?.numComments ?? initial
  if (!hiddenClass) return plural(count, noun)
  return (
    <>
      {compactNumber(count)}
      <span className={hiddenClass}>{` ${noun}${count === 1 ? '' : 's'}`}</span>
    </>
  )
}

/**
 * The comments that arrived since the page loaded, newest first, with the controls. They
 * appear one at a time, paced by `paceComments`. A reader down the page keeps their place: the browser's scroll
 * anchoring holds it where supported, and this scrolls by what was added where it isn't
 * (Safari).
 */
export function LiveComments() {
  const watch = useContext(WatchContext)
  const root = useRef<HTMLDivElement>(null)
  const height = useRef<number | null>(null)

  useLayoutEffect(() => {
    const next = root.current?.offsetHeight ?? 0
    const previous = height.current
    height.current = next
    if (previous === null) return
    const anchored = 'overflowAnchor' in document.documentElement.style
    if (next > previous && !anchored && window.scrollY > READING_OFFSET) {
      window.scrollBy(0, next - previous)
    }
  })

  if (!watch) return null
  const { comments, paused, setPaused, gaveUp } = watch

  return (
    <div ref={root} className={styles.watch}>
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
      {comments.length > 0 ? (
        <ol role="list" className={styles.updates}>
          {comments.map((comment) => (
            <Fragment key={comment.id}>{comment.node}</Fragment>
          ))}
        </ol>
      ) : null}
    </div>
  )
}
