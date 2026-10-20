'use server'

import type { ReactNode } from 'react'
import * as z from 'zod'
import type { ActionResult } from '@/lib/actions/result'
import { invalid, runAction } from '@/lib/actions/run-action'
import { FeedItems } from '@/components/feed/feed-items'
import { ListItems } from '@/components/feed/item-list'
import { SubredditRowItems } from '@/components/subreddit/subreddit-row'
import type { MoreSource } from '@/lib/feed-more'
import {
  getSaved,
  getUserListing,
  searchPeople,
  searchPosts,
  searchSubreddits,
} from '@/lib/reddit/people'
import { getFeed, getMyMultis } from '@/lib/reddit/reads'
import { getSettings } from '@/lib/settings'
import {
  type FeedQuery,
  Fullname,
  HOME_SORTS,
  PROFILE_TABS,
  SAVED_TYPES,
  SEARCH_TABS,
  TIME_RANGES,
} from '@/lib/url-state'

const Request = z.object({
  // Names are validated where the path is built (`getFeed`, `getUserListing`), like a URL segment.
  source: z.discriminatedUnion('type', [
    z.object({ type: z.literal('home') }),
    z.object({ type: z.literal('subreddit'), name: z.string().max(50) }),
    z.object({ type: z.literal('multi'), owner: z.string().max(50), name: z.string().max(50) }),
    z.object({ type: z.literal('saved'), filter: z.enum(SAVED_TYPES) }),
    z.object({ type: z.literal('user'), name: z.string().max(50), tab: z.enum(PROFILE_TABS) }),
    z.object({
      type: z.literal('search'),
      q: z.string().trim().min(1).max(100),
      tab: z.enum(SEARCH_TABS),
    }),
  ]),
  sort: z.enum(HOME_SORTS),
  t: z.enum(TIME_RANGES),
  after: Fullname,
  count: z.number().int().min(0).max(10_000),
  showSubreddit: z.boolean(),
})

export type MoreFeed = { items: ReactNode; after: string | null }

/** One page of `source`, drawn the way its first page was. */
async function renderPage(
  source: MoreSource,
  query: FeedQuery,
  showSubreddit: boolean,
): Promise<MoreFeed> {
  if (source.type === 'search' && source.tab !== 'posts') {
    const [page, multis] = await Promise.all([
      source.tab === 'people' ? searchPeople(source.q, query) : searchSubreddits(source.q, query),
      source.tab === 'communities' ? getMyMultis().catch(() => undefined) : undefined,
    ])
    return {
      items: <SubredditRowItems items={page.items} showDescription multis={multis} />,
      after: page.after,
    }
  }

  const { blurNsfw } = await getSettings()
  const now = Date.now()
  if (source.type === 'home' || source.type === 'subreddit' || source.type === 'multi') {
    const page = await getFeed(source, query)
    return {
      items: (
        <FeedItems posts={page.items} showSubreddit={showSubreddit} blurNsfw={blurNsfw} now={now} />
      ),
      after: page.after,
    }
  }
  const page =
    source.type === 'saved'
      ? await getSaved(source.filter, query)
      : source.type === 'user'
        ? await getUserListing(source.name, source.tab, query)
        : await searchPosts(source.q, query)
  return {
    items: <ListItems items={page.items} now={now} blurNsfw={blurNsfw} />,
    after: page.after,
  }
}

/**
 * The next page of a feed, rendered on the server. The infinite-scroll island
 * appends it as is, so the browser never sees or parses Reddit's JSON.
 */
export async function loadMoreFeed(input: unknown): Promise<ActionResult<MoreFeed>> {
  const parsed = Request.safeParse(input)
  if (!parsed.success) return invalid()
  const { source, sort, t, after, count, showSubreddit } = parsed.data

  return runAction(() => renderPage(source, { sort, t, after, before: null, count }, showSubreddit))
}
