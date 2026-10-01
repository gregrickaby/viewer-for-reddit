import 'server-only'
import { safeMediaUrl } from '@/lib/media/url'
import type { MeView, MultiView, SubredditView, UserView } from '@/lib/view-models'
import { sanitizeRedditHtml } from '../sanitize'
import type { RedditAccount, RedditMe } from '../schemas/account'
import type { RedditMulti } from '../schemas/multi'
import type { RedditSubreddit } from '../schemas/subreddit'
import { hexColor } from './shared'

/** Communities and followed users (`subreddit_type: "user"`, `display_name: "u_<name>"`). */
export function mapSubreddit(subreddit: RedditSubreddit): SubredditView {
  const isUser = subreddit.subreddit_type === 'user'
  const name = isUser ? subreddit.display_name.replace(/^u_/, '') : subreddit.display_name
  return {
    name,
    fullname: `t5_${subreddit.id}`,
    title: subreddit.title,
    href: isUser ? `/user/${name}` : `/r/${name}`,
    kind: isUser ? 'user' : 'community',
    description: sanitizeRedditHtml(subreddit.public_description_html),
    subscribers: subreddit.subscribers ?? null,
    icon: safeMediaUrl(subreddit.community_icon) ?? safeMediaUrl(subreddit.icon_img),
    banner: safeMediaUrl(subreddit.banner_background_image) ?? safeMediaUrl(subreddit.banner_img),
    color: hexColor(subreddit.primary_color) ?? hexColor(subreddit.key_color),
    nsfw: subreddit.over18 ?? false,
    quarantined: subreddit.quarantine ?? false,
    subscribed: subreddit.user_is_subscriber ?? false,
    favorited: subreddit.user_has_favorited ?? false,
  }
}

export function mapUser(account: RedditAccount): UserView {
  const profile = account.subreddit
  return {
    name: account.name,
    fullname: `t2_${account.id}`,
    icon: userIcon(account),
    karma: {
      total: account.total_karma ?? account.link_karma + account.comment_karma,
      post: account.link_karma,
      comment: account.comment_karma,
    },
    createdUtc: account.created_utc,
    verified: account.verified ?? false,
    premium: account.is_gold ?? false,
    followed: profile?.user_is_subscriber ?? false,
    bio: profile?.public_description?.trim() || null,
    nsfw: profile?.over_18 ?? false,
  }
}

/** A people-search result as a row. `fullname` only keys the row: the account's id, not a `t5`. */
export function mapAccountRow(account: RedditAccount): SubredditView {
  const profile = account.subreddit
  return {
    name: account.name,
    fullname: `t5_${account.id}`,
    title: profile?.title?.trim() ?? '',
    href: `/user/${account.name}`,
    kind: 'user',
    description: null,
    subscribers: null,
    icon: userIcon(account),
    banner: null,
    color: null,
    nsfw: profile?.over_18 ?? false,
    quarantined: false,
    subscribed: profile?.user_is_subscriber ?? false,
    favorited: false,
  }
}

export function mapMe(me: RedditMe): MeView {
  return { name: me.name, icon: userIcon(me) }
}

/** The multi's own page: `/m/name` for the viewer's multis, `/user/owner/m/name` otherwise. */
export function mapMulti(multi: RedditMulti, viewer: string): MultiView {
  const own = multi.owner.toLowerCase() === viewer.toLowerCase()
  return {
    name: multi.name,
    displayName: multi.display_name,
    owner: multi.owner,
    href: own ? `/m/${multi.name}` : `/user/${multi.owner}/m/${multi.name}`,
    visibility: visibilityFrom(multi.visibility),
    description: sanitizeRedditHtml(multi.description_html),
    descriptionMd: multi.description_md ?? '',
    subreddits: multi.subreddits.map((entry) => entry.name),
    canEdit: multi.can_edit,
    icon: safeMediaUrl(multi.icon_url),
    nsfw: multi.over_18 ?? false,
  }
}

/** A Snoo avatar beats the legacy icon; both are Reddit-hosted images. */
function userIcon(user: { snoovatar_img?: string | null; icon_img?: string | null }) {
  return safeMediaUrl(user.snoovatar_img) ?? safeMediaUrl(user.icon_img)
}

function visibilityFrom(value: string): MultiView['visibility'] {
  return value === 'public' || value === 'hidden' ? value : 'private'
}
