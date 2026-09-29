import 'server-only'
import { notFound, redirect, unstable_rethrow } from 'next/navigation'
import {
  type ForbiddenReason,
  RedditAuthError,
  RedditForbiddenError,
  RedditNotFoundError,
} from './errors'

/**
 * What a page section does with a failed Reddit read (design §12):
 * - an expired session signs out,
 * - a missing thing is the route's not-found page,
 * - a forbidden community returns its reason, for an inline panel,
 * - anything else is rethrown to the nearest `SectionError`, which offers a retry.
 */
export function handleReadError(error: unknown): ForbiddenReason {
  unstable_rethrow(error)
  if (error instanceof RedditAuthError) redirect('/api/auth/signout?reason=expired')
  if (error instanceof RedditNotFoundError) notFound()
  if (error instanceof RedditForbiddenError) return error.reason
  throw error
}
