'use server'

import type { ReactNode } from 'react'
import * as z from 'zod'
import type { ActionResult } from '@/lib/actions/result'
import { invalid, runAction } from '@/lib/actions/run-action'
import { FeedItems } from '@/components/feed/feed-items'
import { getFeed } from '@/lib/reddit/reads'
import { getSettings } from '@/lib/settings'
import { Fullname, HOME_SORTS, TIME_RANGES } from '@/lib/url-state'

const Request = z.object({
  // Names are validated where the path is built (`getFeed`), like a URL segment.
  source: z.discriminatedUnion('type', [
    z.object({ type: z.literal('home') }),
    z.object({ type: z.literal('subreddit'), name: z.string().max(50) }),
    z.object({ type: z.literal('multi'), owner: z.string().max(50), name: z.string().max(50) }),
  ]),
  sort: z.enum(HOME_SORTS),
  t: z.enum(TIME_RANGES),
  after: Fullname,
  count: z.number().int().min(0).max(10_000),
  showSubreddit: z.boolean(),
})

export type MoreFeed = { items: ReactNode; after: string | null }

/**
 * The next page of a feed, rendered on the server. The infinite-scroll island
 * appends it as is, so the browser never sees or parses Reddit's JSON.
 */
export async function loadMoreFeed(input: unknown): Promise<ActionResult<MoreFeed>> {
  const parsed = Request.safeParse(input)
  if (!parsed.success) return invalid()
  const { source, sort, t, after, count, showSubreddit } = parsed.data

  return runAction(async () => {
    const [page, { blurNsfw }] = await Promise.all([
      getFeed(source, { sort, t, after, before: null, count }),
      getSettings(),
    ])
    return {
      items: (
        <FeedItems
          posts={page.items}
          showSubreddit={showSubreddit}
          blurNsfw={blurNsfw}
          now={Date.now()}
        />
      ),
      after: page.after,
    }
  })
}
