import 'server-only'
import { requireAuth } from '@/lib/auth/session'
import type { CommentSort, ThreadQuery } from '@/lib/url-state'
import type { ThreadView } from '@/lib/view-models'
import { redditFetch } from './client'
import { RedditNotFoundError } from './errors'
import { parseItems, parseListing, parseResponse } from './listing'
import { mapComment, mapCommentTree, mapMore } from './mappers/comment'
import { mapPost } from './mappers/post'
import { type FlatNode, resolveMore } from './more'
import { CommentOrMore } from './schemas/comment'
import { LinkThing } from './schemas/link'
import { CommentsResponse, FormResponse } from './schemas/responses'

const THING_ID = /^[a-z0-9]{1,12}$/

export type ThreadRequest = {
  /** The post id, without `t3_`. */
  id: string
  query: ThreadQuery
  /** A comment id, for the single-thread view. */
  focusCommentId: string | null
}

/**
 * A post and its comments in one Reddit call (design §6.1), with any `more`
 * nodes listed in the URL expanded in place (§8.3).
 */
export async function getThread({ id, query, focusCommentId }: ThreadRequest): Promise<ThreadView> {
  if (!THING_ID.test(id)) throw new RedditNotFoundError()
  const focus = focusCommentId && THING_ID.test(focusCommentId) ? focusCommentId : null
  const { accessToken, username } = await requireAuth()

  const path = `/comments/${id}`
  const json = await redditFetch(path, {
    token: accessToken,
    query: {
      // Left out, Reddit applies the thread's suggested sort.
      sort: query.sort ?? undefined,
      limit: 200,
      depth: 8,
      comment: focus,
      context: focus ? 3 : undefined,
    },
  })
  const [postListing, commentListing] = parseResponse(json, CommentsResponse, path)
  const link = parseListing(postListing, LinkThing, path).items[0]
  if (!link) throw new RedditNotFoundError()

  const post = mapPost(link.data)
  const sort = query.sort ?? post.suggestedSort ?? 'confidence'
  const tree = mapCommentTree(commentListing, path, username)
  const comments =
    query.more.length > 0
      ? await resolveMore(tree, query.more, (children) =>
          fetchMoreChildren(accessToken, username, link.data.name, children, sort),
        )
      : tree

  return { post, sort, comments, focusCommentId: focus }
}

async function fetchMoreChildren(
  token: string,
  viewer: string,
  linkId: string,
  children: string[],
  sort: CommentSort,
): Promise<FlatNode[]> {
  const path = '/api/morechildren'
  const json = await redditFetch(path, {
    token,
    query: {
      api_type: 'json',
      link_id: linkId,
      children: children.join(','),
      sort,
      limit_children: false,
    },
  })
  const things = parseResponse(json, FormResponse, path).json.data?.things ?? []
  return parseItems(things, CommentOrMore, path).map((thing) =>
    thing.kind === 'more'
      ? { parentId: thing.data.parent_id, node: mapMore(thing.data) }
      : {
          parentId: thing.data.parent_id,
          node: { kind: 'comment', comment: mapComment(thing.data, viewer), replies: [] },
        },
  )
}

type RawComment = { id?: unknown; author?: unknown; body?: unknown }

/** Finds the comment with `id` anywhere in a raw comments response. */
function findComment(node: unknown, id: string): RawComment | null {
  if (Array.isArray(node)) {
    for (const child of node) {
      const found = findComment(child, id)
      if (found) return found
    }
  } else if (node && typeof node === 'object') {
    const record = node as Record<string, unknown>
    if (record.id === id && 'body' in record) return record
    for (const child of Object.values(record)) {
      const found = findComment(child, id)
      if (found) return found
    }
  }
  return null
}

/**
 * Waits until Reddit's comment listing reflects a write to one comment: it
 * appears (`'present'`) or is marked deleted (`'deleted'`). Reddit serves the
 * thread from a cache that can lag the write by a second or two, so
 * re-rendering straight away would show the old tree. Gives up quietly.
 */
export async function waitForComment(
  postId: string,
  commentId: string,
  until: 'present' | 'deleted' = 'present',
): Promise<void> {
  if (!THING_ID.test(postId)) return
  const { accessToken } = await requireAuth()
  for (let attempt = 0; attempt < 5; attempt++) {
    if (attempt > 0) await new Promise((resolve) => setTimeout(resolve, 400 * attempt))
    try {
      const json = await redditFetch(`/comments/${postId}`, {
        token: accessToken,
        query: { sort: 'new', limit: 500 },
      })
      const found = findComment(json, commentId)
      if (until === 'present' ? found : !found || found.author === '[deleted]') return
    } catch {
      return
    }
  }
}
