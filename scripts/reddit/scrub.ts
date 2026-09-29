/*
 * Fixtures are committed, so personal data is removed before writing (docs/design.md §11).
 */

export const FIXTURE_USER = 'fixture_user'

/** Public-ish profile fields kept from /api/v1/me; everything else (prefs, email, coins…) is dropped. */
const ME_FIELDS = new Set([
  'name',
  'id',
  'icon_img',
  'snoovatar_img',
  'total_karma',
  'link_karma',
  'comment_karma',
  'created_utc',
  'over_18',
  'is_gold',
  'is_mod',
  'verified',
  'has_verified_email',
  'subreddit',
])

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Replace the signed-in username everywhere (case-insensitive, whole word), and drop modhash. */
export function scrub(value: unknown, username: string): unknown {
  const pattern = new RegExp(`\\b${escapeRegExp(username)}\\b`, 'gi')
  const json = JSON.stringify(value, (key, v: unknown) => (key === 'modhash' ? undefined : v))
  return JSON.parse(json.replace(pattern, FIXTURE_USER)) as unknown
}

export function scrubMe(me: unknown, username: string): unknown {
  if (typeof me !== 'object' || me === null) return me
  const kept = Object.fromEntries(Object.entries(me).filter(([key]) => ME_FIELDS.has(key)))
  return scrub(kept, username)
}
