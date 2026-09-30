import 'server-only'
import { requireAuth } from '@/lib/auth/session'
import type { LiveEventView, LiveUpdateView, Page } from '@/lib/view-models'
import { redditFetch } from './client'
import { RedditNotFoundError } from './errors'
import { parseListing, parseResponse } from './listing'
import { mapLiveEvent, mapLiveUpdate } from './mappers/live'
import { isLiveCursor, isLiveId } from './names'
import { LiveEventThing, LiveUpdateThing } from './schemas/live'

/*
 * Live threads (`/live/{id}`). Reads only: contributing needs the `livemanage`
 * scope, which the app doesn't request.
 */

export const LIVE_PAGE_SIZE = 25

export async function getLiveEvent(id: string): Promise<LiveEventView> {
  if (!isLiveId(id)) throw new RedditNotFoundError()
  const { accessToken } = await requireAuth()
  const path = `/live/${id}/about`
  const json = await redditFetch(path, { token: accessToken })
  return mapLiveEvent(parseResponse(json, LiveEventThing, path).data)
}

export type LiveUpdatesQuery = {
  /** Older than this update. */
  after?: string | null
  /** Newer than this update: what a poll asks for. */
  before?: string | null
}

/** Updates, newest first. `after` pages back in time; `before` returns only what is newer. */
export async function getLiveUpdates(
  id: string,
  { after = null, before = null }: LiveUpdatesQuery = {},
): Promise<Page<LiveUpdateView>> {
  if (!isLiveId(id)) throw new RedditNotFoundError()
  if ((after && !isLiveCursor(after)) || (before && !isLiveCursor(before))) {
    throw new RedditNotFoundError()
  }
  const { accessToken } = await requireAuth()
  const path = `/live/${id}`
  const json = await redditFetch(path, {
    token: accessToken,
    // A poll can't use the default page size: a busy thread outruns 25 updates per interval.
    query: { limit: before ? 100 : LIVE_PAGE_SIZE, after, before },
  })
  const listing = parseListing(json, LiveUpdateThing, path)
  return {
    items: listing.items.map((item) => mapLiveUpdate(item.data)),
    after: listing.after,
    before: listing.before,
  }
}
