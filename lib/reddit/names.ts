import 'server-only'

/*
 * Names that end up in Reddit API paths. Anything that doesn't match is
 * rejected before a request is made (design §11, IDOR row).
 */

const SUBREDDIT = /^[A-Za-z0-9_]{2,21}$/
const USERNAME = /^[A-Za-z0-9_-]{3,20}$/
const MULTI = /^[A-Za-z0-9_]{2,50}$/
const VOTABLE = /^t[13]_[a-z0-9]+$/

export const isSubredditName = (value: string): boolean => SUBREDDIT.test(value)
export const isUsername = (value: string): boolean => USERNAME.test(value)
export const isMultiName = (value: string): boolean => MULTI.test(value)
/** Posts (`t3_`) and comments (`t1_`): the things that can be voted on and saved. */
export const isVotableFullname = (value: string): boolean => VOTABLE.test(value)
