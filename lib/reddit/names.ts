import 'server-only'

/*
 * Names and ids that end up in Reddit API paths or form bodies. Anything that
 * doesn't match is rejected before a request is made, so a crafted name can't
 * reach another endpoint.
 */

const SUBREDDIT = /^[A-Za-z0-9_]{2,21}$/
const USERNAME = /^[A-Za-z0-9_-]{3,20}$/
const MULTI = /^[A-Za-z0-9_]{2,50}$/
const VOTABLE = /^t[13]_[a-z0-9]+$/
const COMMENT = /^t1_[a-z0-9]+$/
/** Exported for Server Action schemas, which validate the same shapes with Zod. */
export const THING_ID_PATTERN = /^[a-z0-9]{1,12}$/
export const LIVE_ID_PATTERN = /^[a-z0-9]{10,16}$/
export const LIVE_CURSOR_PATTERN = /^LiveUpdate_[0-9a-f-]{36}$/

export function isSubredditName(value: string): boolean {
  return SUBREDDIT.test(value)
}

export function isUsername(value: string): boolean {
  return USERNAME.test(value)
}

export function isMultiName(value: string): boolean {
  return MULTI.test(value)
}

/** A post or comment id without its `t3_` or `t1_` prefix, as in `/comments/abc123`. */
export function isThingId(value: string): boolean {
  return THING_ID_PATTERN.test(value)
}

/** Posts (`t3_`) and comments (`t1_`): the things that can be voted on, saved, and replied to. */
export function isVotableFullname(value: string): boolean {
  return VOTABLE.test(value)
}

/** A comment (`t1_`): the only thing that can be edited or deleted here. */
export function isCommentFullname(value: string): boolean {
  return COMMENT.test(value)
}

/** A live thread id, as in `/live/1hnbhsgiy1dhh`. */
export function isLiveId(value: string): boolean {
  return LIVE_ID_PATTERN.test(value)
}

/** The `after`/`before` cursor of a live thread's update listing. */
export function isLiveCursor(value: string): boolean {
  return LIVE_CURSOR_PATTERN.test(value)
}
