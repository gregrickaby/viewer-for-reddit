'use client'

import { useEffect, useRef, useState } from 'react'

export const POLL_MS = 15_000
const MAX_BACKOFF_MS = 120_000
const GIVE_UP_AFTER = 5

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
 * polls at once. `poll` gets its 1-based count, so it can do extra work now and then.
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
    let timer: ReturnType<typeof setTimeout> | undefined

    const schedule = () => {
      const slowdown = 2 ** Math.max(failures, idle)
      timer = setTimeout(tick, Math.min(POLL_MS * slowdown, MAX_BACKOFF_MS))
    }

    async function tick() {
      if (stopped || inFlight || document.hidden) return
      inFlight = true
      polls += 1
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
      clearTimeout(timer)
      idle = 0
      void tick()
    }

    schedule()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      stopped = true
      clearTimeout(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [enabled])

  return gaveUp
}
