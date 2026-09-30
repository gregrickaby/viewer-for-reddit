import 'server-only'

/*
 * Names that end up in Reddit API paths. Anything that doesn't match is
 * rejected before a request is made (design §11, IDOR row).
 */

const SUBREDDIT = /^[A-Za-z0-9_]{2,21}$/
const USERNAME = /^[A-Za-z0-9_-]{3,20}$/
const MULTI = /^[A-Za-z0-9_]{2,50}$/
const VOTABLE = /^t[13]_[a-z0-9]+$/
/** Exported for Server Action schemas, which validate the same shapes with Zod. */
export const LIVE_ID_PATTERN = /^[a-z0-9]{10,16}$/
export const LIVE_CURSOR_PATTERN = /^LiveUpdate_[0-9a-f-]{36}$/

export const isSubredditName = (value: string): boolean => SUBREDDIT.test(value)
export const isUsername = (value: string): boolean => USERNAME.test(value)
export const isMultiName = (value: string): boolean => MULTI.test(value)
/** Posts (`t3_`) and comments (`t1_`): the things that can be voted on and saved. */
export const isVotableFullname = (value: string): boolean => VOTABLE.test(value)
/** A live thread id, as in `/live/1hnbhsgiy1dhh`. */
export const isLiveId = (value: string): boolean => LIVE_ID_PATTERN.test(value)
/** The `after`/`before` cursor of a live thread's update listing. */
export const isLiveCursor = (value: string): boolean => LIVE_CURSOR_PATTERN.test(value)
