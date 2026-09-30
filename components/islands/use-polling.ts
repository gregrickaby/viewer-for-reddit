'use client'

import { useEffect, useRef, useState } from 'react'

export const POLL_MS = 15_000
const MAX_BACKOFF_MS = 120_000
const GIVE_UP_AFTER = 5
/** Returning events closer together than this are one return. */
const RETURN_DEBOUNCE_MS = 2_000

/** How many quiet polls in a row it takes to reach the slowest pace: 15s, 30s, then 60s. */
const MAX_IDLE_STEPS = 2

/**
 * What a poll tells the loop: something arrived (`continue`), nothing did (`idle`, so slow
 * down), the thread ended (`stop`), or the poll failed.
 */
export type PollOutcome = 'continue' | 'idle' | 'stop' | 'fail'

/**
 * Runs `poll` on an interval while `enabled`. Quiet polls slow the pace to once a minute,
 * and the next poll with news restores it. Failures back off (15s, 30s, 60s, then 120s)
 * and stop the loop after five in a row. A hidden tab stops polling; showing it again
 * polls at once, and so does a loop that starts after a quiet stretch (Activity
 * re-showing a page). Safari mobile can skip `visibilitychange` when the app comes
 * back, so `pageshow`, `focus`, and `online` count as returning too. `poll` gets its 1-based count, so it can do extra work now and then.
 * Returns whether the loop gave up.
 */
export function usePolling(
  poll: (count: number) => Promise<PollOutcome>,
  enabled: boolean,
): boolean {
  const [gaveUp, setGaveUp] = useState(false)
  // Resuming starts fresh: state adjusted during render, not in an effect.
  const [wasEnabled, setWasEnabled] = useState(enabled)
  if (enabled !== wasEnabled) {
    setWasEnabled(enabled)
    if (enabled) setGaveUp(false)
  }
  const lastPoll = useRef<number | null>(null)
  const latest = useRef(poll)
  useEffect(() => {
    latest.current = poll
  })

  useEffect(() => {
    if (!enabled) return
    let stopped = false
    let inFlight = false
    let failures = 0
    let idle = 0
    let polls = 0
    let lastReturn = -Infinity
    let timer: ReturnType<typeof setTimeout> | undefined

    const schedule = () => {
      const slowdown = 2 ** Math.max(failures, idle)
      timer = setTimeout(tick, Math.min(POLL_MS * slowdown, MAX_BACKOFF_MS))
    }

    async function tick() {
      if (stopped || inFlight || document.hidden) return
      inFlight = true
      polls += 1
      lastPoll.current = Date.now()
      const outcome = await latest.current(polls)
      inFlight = false
      if (stopped) return

      if (outcome === 'stop') return
      if (outcome === 'fail') {
        failures += 1
        if (failures >= GIVE_UP_AFTER) return setGaveUp(true)
      } else {
        failures = 0
        idle = outcome === 'idle' ? Math.min(idle + 1, MAX_IDLE_STEPS) : 0
      }
      schedule()
    }

    const onVisible = () => {
      if (document.hidden || inFlight) return
      // One return can fire several of these events at once.
      const now = Date.now()
      if (now - lastReturn < RETURN_DEBOUNCE_MS) return
      lastReturn = now
      clearTimeout(timer)
      idle = 0
      void tick()
    }

    // The first run waits a full interval; a later one (the page was hidden and shown
    // again) is stale by definition once an interval has passed.
    if (lastPoll.current !== null && Date.now() - lastPoll.current >= POLL_MS) void tick()
    else {
      lastPoll.current ??= Date.now()
      schedule()
    }
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('pageshow', onVisible)
    window.addEventListener('focus', onVisible)
    window.addEventListener('online', onVisible)
    return () => {
      stopped = true
      clearTimeout(timer)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('pageshow', onVisible)
      window.removeEventListener('focus', onVisible)
      window.removeEventListener('online', onVisible)
    }
  }, [enabled])

  return gaveUp
}
