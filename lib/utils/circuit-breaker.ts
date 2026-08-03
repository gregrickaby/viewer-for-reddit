/**
 * Shared circuit breaker guarding every outbound call to Reddit's API.
 * One instance covers reads (`redditFetch`), mutations/pagination/typeahead
 * (manual `fetch()` call sites), and OAuth token refresh, since they all
 * hit the same downstream host and a Reddit outage affects all of them
 * together.
 */

import {logger} from '@/lib/datadog/server'
import {CircuitOpenError} from '@/lib/utils/errors'
import CircuitBreaker from 'opossum'

type Action = () => Promise<unknown>

const BREAKER_NAME = 'reddit-upstream'

const options: CircuitBreaker.Options<[Action]> = {
  /** Per-call cutoff so a hung request doesn't block a server action indefinitely. */
  timeout: 10_000,
  /** Half of recent calls failing is a real signal, not noise. */
  errorThresholdPercentage: 50,
  /** Minimum calls in the rolling window before the percentage is meaningful. */
  volumeThreshold: 5,
  /** Rolling stats window. */
  rollingCountTimeout: 10_000,
  /** 1s granularity within that window. */
  rollingCountBuckets: 10,
  /** Cooldown before a half-open trial request is allowed through. */
  resetTimeout: 30_000,
  name: BREAKER_NAME
}

function createBreaker(): CircuitBreaker<[Action], unknown> {
  const instance = new CircuitBreaker<[Action], unknown>(
    (action) => action(),
    options
  )

  instance.on('open', () =>
    logger.warn('Reddit circuit breaker opened', {breaker: BREAKER_NAME})
  )
  instance.on('halfOpen', () =>
    logger.info('Reddit circuit breaker half-open, testing recovery', {
      breaker: BREAKER_NAME
    })
  )
  instance.on('close', () =>
    logger.info('Reddit circuit breaker closed, upstream recovered', {
      breaker: BREAKER_NAME
    })
  )

  return instance
}

let breaker = createBreaker()

/**
 * Runs `action` through the shared Reddit-upstream circuit breaker.
 *
 * @param action - Thunk to execute; its own thrown errors propagate unchanged
 * @returns The resolved value of `action`
 * @throws {CircuitOpenError} When the breaker is currently open
 */
export async function withCircuitBreaker<T>(
  action: () => Promise<T>
): Promise<T> {
  try {
    return (await breaker.fire(action as Action)) as T
  } catch (error) {
    if (
      error instanceof Error &&
      (error as {code?: string}).code === 'EOPENBREAKER'
    ) {
      throw new CircuitOpenError(
        'Reddit API circuit breaker is open',
        'withCircuitBreaker'
      )
    }
    throw error
  }
}

/**
 * Test-only hook: discards the current breaker's rolling stats and state,
 * replacing it with a fresh instance, so failures driven in one test don't
 * bleed into the next.
 */
export function resetCircuitBreakerForTests(): void {
  breaker.shutdown()
  breaker = createBreaker()
}
