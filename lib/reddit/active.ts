import 'server-only'
import { requireAuth } from '@/lib/auth/session'
import type { PostView } from '@/lib/view-models'
import { redditFetch } from './client'
import { parseListing } from './listing'
import { mapPost } from './mappers/post'
import { LinkThing } from './schemas/link'

/*
 * Threads people are talking in right now. Reddit has no endpoint for that, so this
 * searches the last day for the kinds of thread that are built to be watched (game,
 * match, daily, live, and race threads), busiest first.
 */

const QUERY = ['game thread', 'match thread', 'daily discussion', 'live thread', 'race thread']
  .map((phrase) => `title:"${phrase}"`)
  .join(' OR ')

/** A thread older than this has usually finished, however many comments it gathered. */
export const ACTIVE_WINDOW_SECONDS = 12 * 60 * 60
const MIN_COMMENTS = 25
const MAX_THREADS = 25

/** `now` is in milliseconds, like `Date.now()`. */
export async function getActiveThreads(now: number): Promise<PostView[]> {
  const { accessToken } = await requireAuth()
  const path = '/search'
  const json = await redditFetch(path, {
    token: accessToken,
    query: { q: QUERY, sort: 'comments', t: 'day', type: 'link', limit: 100 },
  })
  return parseListing(json, LinkThing, path)
    .items.map((item) => mapPost(item.data))
    .filter(
      (post) =>
        now / 1000 - post.createdUtc < ACTIVE_WINDOW_SECONDS &&
        post.numComments >= MIN_COMMENTS &&
        !post.flags.locked &&
        !post.flags.archived,
    )
    .slice(0, MAX_THREADS)
}
