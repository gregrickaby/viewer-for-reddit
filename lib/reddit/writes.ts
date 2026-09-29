import 'server-only'
import { requireAuth } from '@/lib/auth/session'
import type { Vote } from '@/lib/view-models'
import { redditFetch } from './client'
import { RedditApiError } from './errors'
import { parseItems, parseResponse } from './listing'
import { CommentThing } from './schemas/comment'
import { EmptyResponse, FormResponse } from './schemas/responses'

/*
 * Writes (design §6.1). Like the reads, each derives the token from the
 * session. Callers validate ids first (lib/reddit/names.ts).
 */

export async function castVote(fullname: string, dir: Vote): Promise<void> {
  const { accessToken } = await requireAuth()
  const json = await redditFetch('/api/vote', {
    token: accessToken,
    method: 'POST',
    form: { id: fullname, dir },
  })
  parseResponse(json, EmptyResponse, '/api/vote')
}

export async function saveThing(fullname: string, saved: boolean): Promise<void> {
  const { accessToken } = await requireAuth()
  const path = saved ? '/api/save' : '/api/unsave'
  const json = await redditFetch(path, {
    token: accessToken,
    method: 'POST',
    form: { id: fullname },
  })
  parseResponse(json, EmptyResponse, path)
}

/**
 * Posts `text` through one of Reddit's `api_type=json` form endpoints. Reddit
 * reports failures such as a locked thread inside a 200 response, as
 * `json.errors`; the first becomes a `RedditApiError` with its code.
 */
async function submitForm(path: string, form: Record<string, string>) {
  const { accessToken } = await requireAuth()
  const json = await redditFetch(path, {
    token: accessToken,
    method: 'POST',
    form: { api_type: 'json', ...form },
  })
  const { errors, data } = parseResponse(json, FormResponse, path).json
  const [first] = errors
  if (first) throw new RedditApiError(first[1], 200, first[0], first[2] ?? null)
  return parseItems(data?.things ?? [], CommentThing, path)
}

/** Replies to a post (`t3_`) or comment (`t1_`). Returns the new comment's id and its post's. */
export async function submitComment(
  parent: string,
  text: string,
): Promise<{ id: string | null; postId: string | null }> {
  const [created] = await submitForm('/api/comment', { thing_id: parent, text })
  return {
    id: created?.data.id ?? null,
    postId: created?.data.link_id?.replace(/^t3_/, '') ?? null,
  }
}

export async function editComment(fullname: string, text: string): Promise<void> {
  await submitForm('/api/editusertext', { thing_id: fullname, text })
}

export async function deleteComment(fullname: string): Promise<void> {
  const { accessToken } = await requireAuth()
  const json = await redditFetch('/api/del', {
    token: accessToken,
    method: 'POST',
    form: { id: fullname },
  })
  parseResponse(json, EmptyResponse, '/api/del')
}

/**
 * Joins or leaves a community. Following a person is the same call on their
 * profile subreddit, `u_<name>` (design §6.1).
 */
export async function setSubscription(srName: string, subscribe: boolean): Promise<void> {
  const { accessToken } = await requireAuth()
  const json = await redditFetch('/api/subscribe', {
    token: accessToken,
    method: 'POST',
    form: { action: subscribe ? 'sub' : 'unsub', sr_name: srName, skip_initial_defaults: true },
  })
  parseResponse(json, EmptyResponse, '/api/subscribe')
}
