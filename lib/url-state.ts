import * as z from 'zod'

/*
 * Feed state lives in the URL (design §4.1 rule 3, §8.3). Parsing never throws:
 * anything unexpected falls back to a default, so a hand-edited URL still renders.
 */

export const HOME_SORTS = ['best', 'hot', 'new', 'top', 'rising'] as const
export const LISTING_SORTS = ['hot', 'new', 'top', 'rising'] as const
export const TIME_RANGES = ['hour', 'day', 'week', 'month', 'year', 'all'] as const

export type FeedSort = (typeof HOME_SORTS)[number]
export type TimeRange = (typeof TIME_RANGES)[number]

/** Page size for every feed. */
export const PAGE_SIZE = 25

export type FeedQuery = {
  sort: FeedSort
  t: TimeRange
  after: string | null
  before: string | null
  /** Reddit's `count`: how many items the user has paged past (a numbering hint). */
  count: number
}

type SearchParams = Record<string, string | string[] | undefined>

const Fullname = z.string().regex(/^t[1-6]_[a-z0-9]+$/)

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

export function parseFeedQuery(
  params: SearchParams,
  sorts: readonly FeedSort[] = HOME_SORTS,
): FeedQuery {
  const sort = first(params.sort)
  const t = first(params.t)
  const after = Fullname.safeParse(first(params.after))
  const before = Fullname.safeParse(first(params.before))
  const count = Number(first(params.count))

  return {
    sort: sorts.find((value) => value === sort) ?? sorts[0]!,
    t: TIME_RANGES.find((value) => value === t) ?? 'day',
    // Reddit takes one cursor at a time; `after` wins if both are present.
    after: after.success ? after.data : null,
    before: after.success ? null : before.success ? before.data : null,
    count: Number.isInteger(count) && count >= 0 && count <= 10_000 ? count : 0,
  }
}

/** Only `top` (and `controversial`) take a time range. */
export function usesTimeRange(sort: FeedSort): boolean {
  return sort === 'top'
}

/**
 * Items before the current page. Reddit's `count` means "seen so far" after an
 * `after` jump, but "first index + 1" after a `before` jump (design §8.3).
 */
export function pageOffset(query: FeedQuery): number {
  if (query.before) return Math.max(query.count - PAGE_SIZE - 1, 0)
  return query.after ? query.count : 0
}

/** A stable identity for the visible page, used to crossfade same-route changes. */
export function feedKey(query: FeedQuery): string {
  const cursor = query.after ?? query.before ?? 'first'
  return `${query.sort}:${usesTimeRange(query.sort) ? query.t : '-'}:${cursor}`
}

type HrefQuery = Record<string, string | number | null | undefined>

function withQuery(base: string, query: HrefQuery): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value !== null && value !== undefined && value !== '') params.set(key, String(value))
  }
  const search = params.toString()
  return search ? `${base}?${search}` : base
}

/** Sort and time range, without a cursor. The default sort is left out of the URL. */
export function sortHref(
  base: string,
  sort: FeedSort,
  t: TimeRange | null,
  defaultSort: FeedSort,
): string {
  return withQuery(base, {
    sort: sort === defaultSort ? null : sort,
    t: usesTimeRange(sort) ? t : null,
  })
}

function keepSort(query: FeedQuery, defaultSort: FeedSort): HrefQuery {
  return {
    sort: query.sort === defaultSort ? null : query.sort,
    t: usesTimeRange(query.sort) ? query.t : null,
  }
}

export function nextHref(
  base: string,
  query: FeedQuery,
  after: string,
  defaultSort: FeedSort,
): string {
  return withQuery(base, {
    ...keepSort(query, defaultSort),
    after,
    count: pageOffset(query) + PAGE_SIZE,
  })
}

/** Returns to the first page when going back would land there anyway. */
export function prevHref(
  base: string,
  query: FeedQuery,
  firstFullname: string,
  defaultSort: FeedSort,
): string {
  const offset = pageOffset(query)
  if (offset <= PAGE_SIZE) return withQuery(base, keepSort(query, defaultSort))
  return withQuery(base, {
    ...keepSort(query, defaultSort),
    before: firstFullname,
    count: offset + 1,
  })
}

// ── Threads (design §8.3) ─────────────────────────────────────────────────────

export const COMMENT_SORTS = ['confidence', 'top', 'new', 'controversial', 'old', 'qa'] as const
export type CommentSort = (typeof COMMENT_SORTS)[number]

/** How many `more` ids the URL may carry (lib/reddit/more.ts resolves them). */
export const MAX_MORE_IDS = 20

export type ThreadQuery = { sort: CommentSort; more: string[] }

const MORE_ID = /^[a-z0-9]{1,12}$/

export function parseThreadQuery(params: SearchParams): ThreadQuery {
  const sort = first(params.sort)
  const more = (first(params.more) ?? '')
    .split(',')
    .filter((id) => MORE_ID.test(id))
    .slice(0, MAX_MORE_IDS)
  return {
    sort: COMMENT_SORTS.find((value) => value === sort) ?? 'confidence',
    more: [...new Set(more)],
  }
}

/** A thread URL with a comment sort; changing the sort collapses expansions. */
export function threadSortHref(base: string, sort: CommentSort): string {
  return withQuery(base, { sort: sort === 'confidence' ? null : sort })
}

/**
 * The same thread with one more `more` node expanded, anchored at the
 * comment it belongs under so the reader stays in place. Returns null at the cap.
 */
export function expandMoreHref(
  base: string,
  query: ThreadQuery,
  moreId: string,
  anchor: string,
): string | null {
  if (query.more.length >= MAX_MORE_IDS) return null
  const more = [...query.more.filter((id) => id !== moreId), moreId].join(',')
  const href = withQuery(base, { sort: query.sort === 'confidence' ? null : query.sort, more })
  return `${href}#${anchor}`
}
