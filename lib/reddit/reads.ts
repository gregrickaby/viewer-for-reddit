import 'server-only'
import { cacheLife } from 'next/cache'
import { cache } from 'react'
import { requireAuth } from '@/lib/auth/session'
import { type FeedQuery, PAGE_SIZE, usesTimeRange } from '@/lib/url-state'
import type { MeView, MultiView, Page, PostView, SubredditView } from '@/lib/view-models'
import { redditFetch } from './client'
import { RedditNotFoundError } from './errors'
import { parseItems, parseListing, parseResponse } from './listing'
import { mapMe, mapMulti, mapSubreddit } from './mappers/community'
import { mapPost } from './mappers/post'
import { isMultiName, isSubredditName, isUsername } from './names'
import { Me } from './schemas/account'
import { LinkThing } from './schemas/link'
import { MultiThing } from './schemas/multi'
import { MultiListResponse } from './schemas/responses'
import { SubredditThing } from './schemas/subreddit'

/*
 * Reads (design §6.1). Each function derives the token from the session itself,
 * so callers can't run it as someone else. Results are view models only.
 */

export type FeedSource =
  | { type: 'home' }
  | { type: 'subreddit'; name: string }
  | { type: 'multi'; owner: string; name: string }

function feedPath(source: FeedSource, sort: FeedQuery['sort']): string {
  switch (source.type) {
    case 'home':
      return `/${sort}`
    case 'subreddit':
      if (!isSubredditName(source.name)) throw new RedditNotFoundError()
      return `/r/${source.name}/${sort}`
    case 'multi':
      if (!isUsername(source.owner) || !isMultiName(source.name)) throw new RedditNotFoundError()
      return `/user/${source.owner}/m/${source.name}/${sort}`
  }
}

export async function getFeed(source: FeedSource, query: FeedQuery): Promise<Page<PostView>> {
  const path = feedPath(source, query.sort)
  const { accessToken } = await requireAuth()
  const json = await redditFetch(path, {
    token: accessToken,
    query: {
      limit: PAGE_SIZE,
      t: usesTimeRange(query.sort) ? query.t : undefined,
      after: query.after,
      before: query.before,
      count: query.count || undefined,
      include_over_18: 'on',
    },
  })
  const listing = parseListing(json, LinkThing, path)
  return {
    items: listing.items.map((item) => mapPost(item.data)),
    after: listing.after,
    before: listing.before,
  }
}

export async function getSubreddit(name: string): Promise<SubredditView> {
  if (!isSubredditName(name)) throw new RedditNotFoundError()
  const { accessToken } = await requireAuth()
  const path = `/r/${name}/about`
  const json = await redditFetch(path, { token: accessToken })
  return mapSubreddit(parseResponse(json, SubredditThing, path).data)
}

/** Reddit caps a page at 100; ten pages covers accounts with up to 1,000 subscriptions. */
const SUBSCRIPTION_PAGES = 10

/**
 * Every subscription, communities and followed users alike. Pages are fetched
 * one after another because each depends on the previous cursor.
 */
export const getMySubscriptions = cache(async (): Promise<SubredditView[]> => {
  const { accessToken } = await requireAuth()
  const path = '/subreddits/mine/subscriber'
  const all: SubredditView[] = []
  let after: string | null = null

  for (let page = 0; page < SUBSCRIPTION_PAGES; page += 1) {
    const json = await redditFetch(path, { token: accessToken, query: { limit: 100, after } })
    const listing = parseListing(json, SubredditThing, path)
    all.push(...listing.items.map((item) => mapSubreddit(item.data)))
    after = listing.after
    if (!after) break
  }

  return all.sort((a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }))
})

export const getMyMultis = cache(async (): Promise<MultiView[]> => {
  const { accessToken, username } = await requireAuth()
  const path = '/api/multi/mine'
  const json = await redditFetch(path, { token: accessToken })
  const things = parseItems(parseResponse(json, MultiListResponse, path), MultiThing, path)
  return things
    .map((thing) => mapMulti(thing.data, username))
    .sort((a, b) => a.displayName.localeCompare(b.displayName, 'en', { sensitivity: 'base' }))
})

/**
 * The signed-in user's name and avatar. Identity changes rarely, so it is
 * kept per session for five minutes rather than fetched on every navigation.
 */
export async function getMe(): Promise<MeView> {
  'use cache: private'
  cacheLife({ stale: 300 })
  const { accessToken } = await requireAuth()
  const json = await redditFetch('/api/v1/me', { token: accessToken })
  return mapMe(parseResponse(json, Me, '/api/v1/me'))
}
