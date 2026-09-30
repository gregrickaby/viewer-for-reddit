'use server'

import type { ReactNode } from 'react'
import * as z from 'zod'
import type { ActionResult } from '@/lib/actions/result'
import { invalid, runAction } from '@/lib/actions/run-action'
import { LiveUpdateItems } from '@/components/live/live-update-items'
import { getLiveEvent, getLiveUpdates } from '@/lib/reddit/live'
import { LIVE_CURSOR_PATTERN, LIVE_ID_PATTERN } from '@/lib/reddit/names'

const Cursor = z.string().regex(LIVE_CURSOR_PATTERN)
const Id = z.string().regex(LIVE_ID_PATTERN)

const PollRequest = z.object({
  id: Id,
  before: Cursor.nullable(),
  /** Also re-read the thread itself, for its state and viewer count. */
  meta: z.boolean(),
})

const OlderRequest = z.object({ id: Id, after: Cursor })

export type LivePoll = {
  items: ReactNode
  count: number
  /** The newest update's cursor, or null when nothing new came back. */
  newest: string | null
  event: { live: boolean; viewers: number | null } | null
}

export type LiveOlder = { items: ReactNode; after: string | null }

/**
 * Updates newer than `before`, rendered on the server. The live island calls this
 * on a timer, so the browser never sees Reddit's JSON. The thread itself is only
 * re-read when `meta` is set, which keeps a poll to one Reddit call most of the time.
 */
export async function pollLive(input: unknown): Promise<ActionResult<LivePoll>> {
  const parsed = PollRequest.safeParse(input)
  if (!parsed.success) return invalid()
  const { id, before, meta } = parsed.data

  return runAction(async () => {
    const [page, event] = await Promise.all([
      getLiveUpdates(id, { before }),
      meta ? getLiveEvent(id) : null,
    ])
    return {
      items: <LiveUpdateItems updates={page.items} now={Date.now()} />,
      count: page.items.length,
      newest: page.items[0]?.name ?? null,
      event: event ? { live: event.live, viewers: event.viewers } : null,
    }
  })
}

/** The page of updates before `after`, for the "Load older updates" button. */
export async function loadOlderLive(input: unknown): Promise<ActionResult<LiveOlder>> {
  const parsed = OlderRequest.safeParse(input)
  if (!parsed.success) return invalid()
  const { id, after } = parsed.data

  return runAction(async () => {
    const page = await getLiveUpdates(id, { after })
    return {
      items: <LiveUpdateItems updates={page.items} now={Date.now()} />,
      after: page.after,
    }
  })
}
