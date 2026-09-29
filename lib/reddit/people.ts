import 'server-only'
import * as z from 'zod'
import { requireAuth } from '@/lib/auth/session'
import {
  type FeedQuery,
  PAGE_SIZE,
  type ProfileTab,
  type SavedType,
  usesTimeRange,
} from '@/lib/url-state'
import type { ListItem, Page, ProfileView, SubredditView } from '@/lib/view-models'
import { redditFetch } from './client'
import { RedditNotFoundError } from './errors'
import { parseListing, parseResponse } from './listing'
import { mapComment } from './mappers/comment'
import { mapSubreddit, mapUser } from './mappers/community'
import { mapPost } from './mappers/post'
import { isUsername } from './names'
import { ProfileThing } from './schemas/account'
import { CommentThing } from './schemas/comment'
import { LinkThing } from './schemas/link'
import { SubredditThing } from './schemas/subreddit'

/*
 * Reads for saved items, profiles, and subreddit search (design §6.1).
 */

const PostOrComment = z.discriminatedUnion('kind', [LinkThing, CommentThing])

function cursors(query: Pick<FeedQuery, 'after' | 'before' | 'count'>) {
  return {
    limit: PAGE_SIZE,
    after: query.after,
    before: query.before,
    count: query.count || undefined,
  }
}

async function mixedListing(
  path: string,
  query: Record<string, string | number | null | undefined>,
): Promise<Page<ListItem>> {
  const { accessToken, username } = await requireAuth()
  const json = await redditFetch(path, { token: accessToken, query })
  const listing = parseListing(json, PostOrComment, path)
  return {
    items: listing.items.map((thing): ListItem =>
      thing.kind === 't3'
        ? { kind: 'post', post: mapPost(thing.data) }
        : { kind: 'comment', comment: mapComment(thing.data, username) },
    ),
    after: listing.after,
    before: listing.before,
  }
}

/** The viewer's saved posts and comments, newest first. */
export async function getSaved(type: SavedType, query: FeedQuery): Promise<Page<ListItem>> {
  const { username } = await requireAuth()
  return mixedListing(`/user/${username}/saved`, {
    ...cursors(query),
    type: type === 'all' ? undefined : type,
  })
}

/** Someone's posts and comments: all of them, or one kind. */
export async function getUserListing(
  username: string,
  tab: ProfileTab,
  query: FeedQuery,
): Promise<Page<ListItem>> {
  if (!isUsername(username)) throw new RedditNotFoundError()
  return mixedListing(`/user/${username}/${tab}`, {
    ...cursors(query),
    sort: query.sort,
    t: usesTimeRange(query.sort) ? query.t : undefined,
  })
}

/** The profile header: karma, cake day, avatar, and whether the viewer follows them. */
export async function getProfile(username: string): Promise<ProfileView> {
  if (!isUsername(username)) throw new RedditNotFoundError()
  const { accessToken } = await requireAuth()
  const path = `/user/${username}/about`
  const json = await redditFetch(path, { token: accessToken })
  const { data } = parseResponse(json, ProfileThing, path)
  return 'is_suspended' in data
    ? { kind: 'suspended', name: data.name }
    : { kind: 'active', user: mapUser(data) }
}

/** Communities matching `q`, NSFW included (design §8.7). */
export async function searchSubreddits(q: string, query: FeedQuery): Promise<Page<SubredditView>> {
  const { accessToken } = await requireAuth()
  const path = '/subreddits/search'
  const json = await redditFetch(path, {
    token: accessToken,
    query: { ...cursors(query), q, include_over_18: 'on' },
  })
  const listing = parseListing(json, SubredditThing, path)
  return {
    items: listing.items.map((thing) => mapSubreddit(thing.data)),
    after: listing.after,
    before: listing.before,
  }
}
