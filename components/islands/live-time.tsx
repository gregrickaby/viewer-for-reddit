'use client'

import { useState, useSyncExternalStore } from 'react'
import { absoluteTime, isoTime, timeAgo } from '@/lib/format'

const TICK_MS = 30_000

/*
 * One shared timer for every timestamp on the page: a live thread can hold
 * hundreds of updates, and each would otherwise run its own interval.
 */
let ticks = 0
let timer: ReturnType<typeof setInterval> | undefined
const listeners = new Set<() => void>()

function subscribe(listener: () => void) {
  listeners.add(listener)
  timer ??= setInterval(() => {
    ticks += 1
    listeners.forEach((notify) => notify())
  }, TICK_MS)
  return () => {
    listeners.delete(listener)
    if (listeners.size === 0) {
      clearInterval(timer)
      timer = undefined
    }
  }
}

const getTicks = () => ticks

/** A relative time that keeps counting after the server rendered it. `now` is the render time. */
export function LiveTime({ utc, now }: { utc: number; now: number }) {
  const current = useSyncExternalStore(subscribe, getTicks, () => 0)
  // The tick count when this mounted, so the first render matches the server's.
  const [mountedAt] = useState(getTicks)
  return (
    <time dateTime={isoTime(utc)} title={absoluteTime(utc)}>
      {timeAgo(utc, now + (current - mountedAt) * TICK_MS)}
    </time>
  )
}
