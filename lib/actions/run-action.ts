import 'server-only'
import { redirect, unstable_rethrow } from 'next/navigation'
import { SessionUnavailableError } from '@/lib/auth/session'
import {
  RedditApiError,
  RedditAuthError,
  RedditForbiddenError,
  RedditNotFoundError,
  RedditRateLimitError,
} from '@/lib/reddit/errors'
import type { ActionError, ActionResult } from './result'

/** Reddit's form error codes, in words a person would use. */
const REDDIT_MESSAGES: Record<string, string> = {
  THREAD_LOCKED: 'This thread is locked.',
  TOO_OLD: 'This is archived and can no longer be changed.',
  RATELIMIT: 'Reddit says you’re doing that too often. Try again in a bit.',
  TOO_LONG: 'That’s too long for Reddit.',
  DELETED_COMMENT: 'That comment was deleted.',
  DELETED_LINK: 'That post was deleted.',
  NO_TEXT: 'Write something first.',
  USER_REQUIRED: 'Reddit needs you to sign in again.',
  SUBREDDIT_NOEXIST: 'That community doesn’t exist.',
}

export function invalid(message = 'That request wasn’t valid.'): ActionResult<never> {
  return { ok: false, error: { code: 'INVALID', message } }
}

/**
 * Runs a Server Action's work and turns every failure into an `ActionResult`
 * (design §8.2): nothing raw reaches the client. An expired session signs the
 * user out; Next's own control-flow errors pass through.
 */
export async function runAction<T>(work: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    return { ok: true, data: await work() }
  } catch (error) {
    unstable_rethrow(error)
    if (error instanceof RedditAuthError) redirect('/api/auth/signout?reason=expired')
    return { ok: false, error: describe(error) }
  }
}

function describe(error: unknown): ActionError {
  if (error instanceof SessionUnavailableError) {
    return { code: 'UNAVAILABLE', message: error.message }
  }
  if (error instanceof RedditRateLimitError) {
    return {
      code: 'RATE_LIMITED',
      message: `Reddit is rate-limiting us. Try again in ${error.resetSeconds}s.`,
    }
  }
  if (error instanceof RedditForbiddenError) {
    return { code: 'FORBIDDEN', message: 'Reddit doesn’t allow that here.' }
  }
  if (error instanceof RedditNotFoundError) {
    return { code: 'NOT_FOUND', message: 'That no longer exists on Reddit.' }
  }
  if (error instanceof RedditApiError) {
    const known = error.code ? REDDIT_MESSAGES[error.code] : undefined
    return { code: 'REDDIT', message: known ?? 'Reddit couldn’t do that. Try again.' }
  }
  console.error('[action] unexpected failure', error)
  return { code: 'UNKNOWN', message: 'Something went wrong. Try again.' }
}
