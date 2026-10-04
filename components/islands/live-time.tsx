'use client'

import { useState, useSyncExternalStore } from 'react'
import { absoluteTime, isoTime, timeAgo } from '@/lib/format'

export const TICK_MS = 30_000
/** Timestamps updated per task, so a thread with hundreds doesn't block input. */
export const CHUNK = 50

/*
 * One shared timer for every timestamp on the page: a live thread can hold
 * hundreds of updates, and each would otherwise run its own interval. Ticks
 * count from the clock, not the timer, so skipping them in a hidden tab loses nothing.
 */
const started = Date.now()
let ticks = 0
let timer: ReturnType<typeof setInterval> | undefined
const listeners = new Set<() => void>()

function tick() {
  const current = Math.floor((Date.now() - started) / TICK_MS)
  if (document.hidden || current === ticks) return
  ticks = current
  const pending = [...listeners]
  const notify = () => {
    for (const listener of pending.splice(0, CHUNK)) listener()
    if (pending.length > 0) setTimeout(notify)
  }
  notify()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  if (!timer) {
    timer = setInterval(tick, TICK_MS)
    document.addEventListener('visibilitychange', tick)
  }
  return () => {
    listeners.delete(listener)
    if (listeners.size === 0) {
      clearInterval(timer)
      timer = undefined
      document.removeEventListener('visibilitychange', tick)
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
