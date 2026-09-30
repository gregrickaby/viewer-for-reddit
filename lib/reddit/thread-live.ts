import 'server-only'
import { createHash } from 'node:crypto'
import { requireAuth } from '@/lib/auth/session'
import type { CommentNode, CommentView, PostView } from '@/lib/view-models'
import { redditFetch } from './client'
import { RedditNotFoundError } from './errors'
import { parseItems, parseListing, parseResponse } from './listing'
import { mapComment } from './mappers/comment'
import { mapPost } from './mappers/post'
import { CommentOrMore, type RedditComment } from './schemas/comment'
import { LinkThing, type RedditLink } from './schemas/link'
import { CommentsResponse } from './schemas/responses'

/*
 * Watching a thread for new comments. Reddit has no "since" parameter, so each poll
 * reads the newest comments (`sort=new`, replies included) and keeps the ones past a cursor.
 */

const THING_ID = /^[a-z0-9]{1,12}$/

/** Only threads this young are watched: game threads last hours, and older ones rarely move. */
export const WATCH_WINDOW_SECONDS = 48 * 60 * 60

/** How many of the newest comments a poll reads. `limit` counts replies too. */
const POLL_LIMIT = 100

/*
 * Reddit's budget is about 100 requests a minute for the whole app, and one watcher
 * costs four. So a thread's newest comments are read once per `CACHE_MS` and shared
 * by everyone watching it.
 *
 * They were fetched with one reader's token, so only threads anyone may read are kept
 * (a public, non-quarantined community), and the per-reader fields are cleared first.
 */
const CACHE_MS = 10_000
const CACHE_MAX = 200

type Snapshot = { link: RedditLink; loaded: Flat[] }
const cache = new Map<string, { at: number; snapshot: Snapshot }>()

/** Test hook. */
export function clearThreadCache(): void {
  cache.clear()
}

const readableByAnyone = (link: RedditLink) =>
  link.subreddit_type === 'public' && link.quarantine !== true

function cached(id: string, now: number): Snapshot | null {
  const entry = cache.get(id)
  if (!entry) return null
  if (now - entry.at < CACHE_MS) return entry.snapshot
  cache.delete(id)
  return null
}

function remember(id: string, snapshot: Snapshot, now: number): void {
  if (!readableByAnyone(snapshot.link)) return
  for (const [key, entry] of cache) if (now - entry.at >= CACHE_MS) cache.delete(key)
  // Oldest first: a Map iterates in insertion order.
  while (cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value!)
  cache.set(id, {
    at: now,
    snapshot: {
      link: { ...snapshot.link, likes: null, saved: false },
      loaded: snapshot.loaded.map(({ comment, parentAuthor }) => ({
        comment: { ...comment, likes: null, saved: false },
        parentAuthor,
      })),
    },
  })
}

/**
 * Everything at or before `since` has been shown. Comments created in that same
 * second are told apart by id, because `created_utc` only has one-second resolution.
 */
export type WatchCursor = { since: number; seen: string[] }

export type NewComment = {
  comment: CommentView
  /** The author being replied to, when that comment is in the newest page. */
  replyTo: string | null
}

export type ThreadPoll = {
  comments: NewComment[]
  cursor: WatchCursor
  post: PostView
  /** Identifies the post's body, so a poll can tell whether it was edited. */
  bodyHash: string
}

export function bodyHashOf(body: string | null): string {
  return createHash('sha1')
    .update(body ?? '')
    .digest('base64url')
    .slice(0, 16)
}

/** The cursor for a tree that was just rendered: its newest comment. */
export function cursorFromTree(tree: CommentNode[]): WatchCursor {
  const all: Array<{ id: string; createdUtc: number }> = []
  const visit = (nodes: CommentNode[]) => {
    for (const node of nodes) {
      if (node.kind !== 'comment') continue
      all.push(node.comment)
      visit(node.replies)
    }
  }
  visit(tree)
  return cursorFrom(all.map((item) => ({ id: item.id, created: item.createdUtc })))
}

function cursorFrom(items: Array<{ id: string; created: number }>): WatchCursor {
  const since = items.reduce((newest, item) => Math.max(newest, item.created), 0)
  return { since, seen: items.filter((item) => item.created === since).map((item) => item.id) }
}

type Flat = { comment: RedditComment; parentAuthor: string | null }

/** Every comment in a response, replies included. A malformed reply listing is skipped. */
function flatten(listing: unknown, path: string, authors = new Map<string, string>()): Flat[] {
  const items = parseListing(listing, CommentOrMore, path).items
  const found: Flat[] = []
  for (const item of items) {
    if (item.kind !== 't1') continue
    authors.set(item.data.name, item.data.author)
  }
  for (const item of items) {
    if (item.kind !== 't1') continue
    found.push({ comment: item.data, parentAuthor: authors.get(item.data.parent_id) ?? null })
    if (typeof item.data.replies === 'object' && item.data.replies !== null) {
      try {
        found.push(...flatten(item.data.replies, path, authors))
      } catch {
        // A reply listing that doesn't parse is one less reply, not a failed poll.
      }
    }
  }
  return found
}

async function load(id: string, token: string): Promise<Snapshot> {
  const path = `/comments/${id}`
  const json = await redditFetch(path, {
    token,
    query: { sort: 'new', limit: POLL_LIMIT, depth: 8 },
  })
  const [postListing, commentListing] = parseResponse(json, CommentsResponse, path)
  const link = parseItems(postListing.data.children, LinkThing, path)[0]
  if (!link) throw new RedditNotFoundError()
  return { link: link.data, loaded: flatten(commentListing, path) }
}

export async function pollThread(id: string, cursor: WatchCursor): Promise<ThreadPoll> {
  if (!THING_ID.test(id)) throw new RedditNotFoundError()
  // The session is checked even when the answer comes from the cache.
  const { accessToken, username } = await requireAuth()

  const now = Date.now()
  let snapshot = cached(id, now)
  if (!snapshot) {
    snapshot = await load(id, accessToken)
    remember(id, snapshot, now)
  }
  const { link, loaded } = snapshot
  const post = mapPost(link)
  // A reply's parent can be outside this page, so its author is unknown there.
  const seen = new Set(cursor.seen)
  const fresh = loaded
    .filter(
      ({ comment }) =>
        comment.created_utc > cursor.since ||
        (comment.created_utc === cursor.since && !seen.has(comment.id)),
    )
    .sort((a, b) => b.comment.created_utc - a.comment.created_utc)

  return {
    comments: fresh.map(({ comment, parentAuthor }) => ({
      comment: mapComment(comment, username),
      replyTo: parentAuthor && parentAuthor !== '[deleted]' ? parentAuthor : null,
    })),
    cursor:
      fresh.length > 0
        ? cursorFrom(
            loaded.map(({ comment }) => ({ id: comment.id, created: comment.created_utc })),
          )
        : cursor,
    post,
    bodyHash: bodyHashOf(post.body),
  }
}
