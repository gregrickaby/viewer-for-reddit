import 'server-only'
import { requireAuth } from '@/lib/auth/session'
import type { MultiView } from '@/lib/view-models'
import { redditFetch } from './client'
import { RedditApiError, RedditNotFoundError } from './errors'
import { parseResponse } from './listing'
import { mapMulti } from './mappers/community'
import { isMultiName, isSubredditName } from './names'
import { MultiThing } from './schemas/multi'
import { EmptyResponse } from './schemas/responses'

/*
 * Multireddit management (design §6.1). The multipath always comes from the
 * session (`user/<me>/m/<name>`), never from the client.
 */

export type MultiVisibility = MultiView['visibility']

/** What the edit form controls. Subreddits are managed one at a time. */
export type MultiDetails = {
  displayName: string
  description: string
  visibility: MultiVisibility
}

/**
 * A URL name from a display name: lowercase, anything else becomes `_`,
 * runs collapsed and ends trimmed, at most 50 characters. Null if too short.
 */
export function multiSlug(displayName: string): string | null {
  const slug = displayName
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 50)
    .replace(/_$/, '')
  return isMultiName(slug) ? slug : null
}

async function multiPath(name: string): Promise<{ token: string; viewer: string; path: string }> {
  if (!isMultiName(name)) throw new RedditNotFoundError()
  const { accessToken, username } = await requireAuth()
  return { token: accessToken, viewer: username, path: `/api/multi/user/${username}/m/${name}` }
}

function model(details: MultiDetails, subreddits: string[]): string {
  return JSON.stringify({
    display_name: details.displayName,
    description_md: details.description,
    visibility: details.visibility,
    subreddits: subreddits.map((name) => ({ name })),
  })
}

/** One of the viewer's multis, with its subreddits. */
export async function getMulti(name: string): Promise<MultiView> {
  const { token, viewer, path } = await multiPath(name)
  const json = await redditFetch(path, { token, query: { expand_srs: true } })
  return mapMulti(parseResponse(json, MultiThing, path).data, viewer)
}

/** Creates an empty, private multi. Returns it as Reddit saved it. */
export async function createMulti(details: Omit<MultiDetails, 'visibility'>): Promise<MultiView> {
  const name = multiSlug(details.displayName)
  if (!name) throw new RedditApiError('Invalid multi name', 400, 'BAD_MULTI_NAME')
  const { token, viewer, path } = await multiPath(name)
  const json = await redditFetch(path, {
    token,
    method: 'POST',
    form: { model: model({ ...details, visibility: 'private' }, []) },
  })
  return mapMulti(parseResponse(json, MultiThing, path).data, viewer)
}

/** Updates name, description, and visibility, keeping the current subreddits. */
export async function updateMulti(name: string, details: MultiDetails): Promise<void> {
  const current = await getMulti(name)
  const { token, path } = await multiPath(name)
  const json = await redditFetch(path, {
    token,
    method: 'PUT',
    form: { model: model(details, current.subreddits) },
  })
  parseResponse(json, MultiThing, path)
}

export async function deleteMulti(name: string): Promise<void> {
  const { token, path } = await multiPath(name)
  const json = await redditFetch(path, { token, method: 'DELETE' })
  parseResponse(json, EmptyResponse, path)
}

/** Adds or removes one subreddit. `subreddit` should be canonical (see `getSubreddit`). */
export async function setMultiMembership(
  name: string,
  subreddit: string,
  member: boolean,
): Promise<void> {
  if (!isSubredditName(subreddit)) throw new RedditNotFoundError()
  const { token, path } = await multiPath(name)
  const srPath = `${path}/r/${subreddit}`
  const json = await redditFetch(srPath, {
    token,
    method: member ? 'PUT' : 'DELETE',
    form: member ? { model: JSON.stringify({ name: subreddit }) } : undefined,
  })
  parseResponse(json, EmptyResponse, srPath)
}
