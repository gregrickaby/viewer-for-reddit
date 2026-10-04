/*
 * Plain, serializable types that Server Components render (docs/design.md §7).
 * The UI never sees raw Reddit objects. This module holds types only, so client
 * islands may import from it.
 */

/**
 * Sanitized HTML. Only `lib/reddit/sanitize.ts` can produce one; it is rendered
 * only by `components/reddit-html.tsx`.
 */
import type { CommentSort } from '@/lib/url-state'

export type SafeHtml = string & { readonly __brand: 'SafeHtml' }

/** Reddit's `likes`: true → 1, false → -1, null → 0. */
export type Vote = -1 | 0 | 1

/** One page of a cursor-paginated listing. */
export type Page<T> = { items: T[]; after: string | null; before: string | null }

/** Why content is gone: removed by moderators or Reddit, or deleted by its author. */
export type Removal = 'removed' | 'deleted'

/** `moderator` and `admin` get a badge; Reddit uses other values rarely. */
export type Distinguished = 'moderator' | 'admin' | null

/** A piece of flair: text, or one of the community's emoji (Reddit writes them `:name:`). */
export type FlairPart =
  { kind: 'text'; text: string } | { kind: 'emoji'; name: string; src: string }

export type FlairView = {
  /** The flair as plain text, with emoji as their `:name:` codes. */
  text: string
  parts: FlairPart[]
  /** A validated hex color, or null for the default chip. */
  backgroundColor: string | null
  /** Reddit sends which text color reads on the background. */
  textColor: 'light' | 'dark'
}

// ── Media (design §8.7) ────────────────────────────────────────────────────────

export type ImageSet = {
  src: string
  /** `url 640w, url 960w, …`, including the source. */
  srcSet: string
  width: number
  height: number
  /** Reddit's pre-blurred rendition, used behind the NSFW and spoiler reveal. */
  blurred: { src: string; srcSet: string } | null
}

/** A silent MP4 that loops like a GIF. */
export type LoopVideo = { mp4: string; width: number; height: number }

/** HLS with audio, and an MP4 fallback (silent on v.redd.it) when one exists. */
export type StreamVideo = {
  hls: string
  mp4Fallback: string | null
  width: number
  height: number
  durationSec: number | null
}

export type ProviderId =
  | 'youtube'
  | 'vimeo'
  | 'streamable'
  | 'twitch'
  | 'redgifs'
  | 'giphy'
  | 'imgur'
  | 'tiktok'
  | 'spotify'
  | 'soundcloud'

export type EmbedView = {
  provider: ProviderId
  title: string
  iframeSrc: string
  aspectRatio: number
  /** A fixed player height in px (audio players); when set, `aspectRatio` is ignored. */
  height: number | null
  allow: string
  sandbox: string
  originalUrl: string
}

export type ImageMedia = { type: 'image'; image: ImageSet }
export type AnimatedMedia = {
  type: 'animated'
  loop: LoopVideo | null
  gif: ImageSet | null
  poster: ImageSet | null
}
export type VideoMedia = { type: 'video'; video: StreamVideo; poster: ImageSet | null }

export type GalleryItem = {
  media: ImageMedia | AnimatedMedia | VideoMedia
  caption: string | null
  outboundUrl: string | null
}

export type PostMedia =
  | { type: 'none' }
  | ImageMedia
  | AnimatedMedia
  | VideoMedia
  | { type: 'gallery'; items: GalleryItem[] }
  | { type: 'embed'; embed: EmbedView; poster: ImageSet | null }
  | { type: 'link'; url: string; domain: string; thumbnail: ImageSet | null }

// ── Posts and comments ────────────────────────────────────────────────────────

export type PostView = {
  id: string
  fullname: `t3_${string}`
  subreddit: string
  /** null when the account is deleted. */
  author: string | null
  title: string
  /** App-internal path: /r/nextjs/comments/abc123/slug */
  permalink: string
  createdUtc: number
  editedUtc: number | null
  score: number
  hideScore: boolean
  likes: Vote
  numComments: number
  saved: boolean
  flags: { nsfw: boolean; spoiler: boolean; stickied: boolean; locked: boolean; archived: boolean }
  distinguished: Distinguished
  removal: Removal | null
  flair: FlairView | null
  /** Self text. */
  body: SafeHtml | null
  media: PostMedia
  crosspostFrom: { subreddit: string; author: string | null; permalink: string } | null
  /** The comment sort the moderators chose for this thread, if any (game threads: new). */
  suggestedSort: CommentSort | null
}

export type CommentView = {
  id: string
  fullname: `t1_${string}`
  /** null when the account is deleted. */
  author: string | null
  /** null when the comment is deleted or removed (see `removal`). */
  body: SafeHtml | null
  createdUtc: number
  editedUtc: number | null
  score: number
  scoreHidden: boolean
  likes: Vote
  saved: boolean
  flags: {
    stickied: boolean
    locked: boolean
    archived: boolean
    isSubmitter: boolean
    collapsed: boolean
  }
  distinguished: Distinguished
  removal: Removal | null
  flair: FlairView | null
  permalink: string
  depth: number
  /** The post a comment belongs to, when it's listed outside its thread (saved, profiles). */
  context: { postTitle: string; postPermalink: string; subreddit: string } | null
  /** Written by the signed-in user: they may edit and delete it. */
  mine: boolean
  /** The raw markdown, only for the viewer's own comments, to prefill the edit form. */
  bodyMarkdown: string | null
}

/** A post with its comment tree. */
export type ThreadView = {
  post: PostView
  /** The sort the comments are in: the URL's, else the thread's suggested one, else Best. */
  sort: CommentSort
  comments: CommentNode[]
  /** Set when viewing a single comment's thread (`…/comments/<post>/<slug>/<comment>`). */
  focusCommentId: string | null
}

export type MoreNode = {
  kind: 'more'
  id: string
  parentId: string
  depth: number
  /** 0 with no children means "continue this thread" (link to the parent comment). */
  count: number
  children: string[]
}

export type CommentNode =
  { kind: 'comment'; comment: CommentView; replies: CommentNode[] } | MoreNode

// ── Live threads ──────────────────────────────────────────────────────────────

export type LiveEventView = {
  id: string
  title: string
  description: SafeHtml | null
  resources: SafeHtml | null
  /** false once the thread is closed: there is nothing left to poll for. */
  live: boolean
  viewers: number | null
  nsfw: boolean
  createdUtc: number
}

export type LiveUpdateView = {
  /** The listing cursor, `LiveUpdate_<uuid>`. */
  name: string
  author: string | null
  body: SafeHtml | null
  createdUtc: number
  stricken: boolean
}

// ── Communities, people, multis ───────────────────────────────────────────────

export type SubredditView = {
  name: string
  fullname: `t5_${string}`
  title: string
  /** App-internal path: /r/name, or /user/name for a followed user's profile. */
  href: string
  kind: 'community' | 'user'
  description: SafeHtml | null
  subscribers: number | null
  icon: string | null
  banner: string | null
  color: string | null
  nsfw: boolean
  quarantined: boolean
  subscribed: boolean
  favorited: boolean
}

export type UserView = {
  name: string
  fullname: `t2_${string}`
  icon: string | null
  karma: { total: number; post: number; comment: number }
  createdUtc: number
  verified: boolean
  premium: boolean
  /** Whether the viewer follows this user. */
  followed: boolean
  bio: string | null
  nsfw: boolean
}

export type MeView = { name: string; icon: string | null }

/** A profile page's subject: an active account, or one Reddit suspended. */
export type ProfileView = { kind: 'active'; user: UserView } | { kind: 'suspended'; name: string }

/** An entry in a mixed listing (saved items, a profile's overview). */
export type ListItem = { kind: 'post'; post: PostView } | { kind: 'comment'; comment: CommentView }

export type MultiView = {
  name: string
  displayName: string
  owner: string
  /** App-internal path: /m/name for the viewer's own, /user/owner/m/name otherwise. */
  href: string
  visibility: 'private' | 'public' | 'hidden'
  description: SafeHtml | null
  descriptionMd: string
  subreddits: string[]
  canEdit: boolean
  icon: string | null
  nsfw: boolean
}
