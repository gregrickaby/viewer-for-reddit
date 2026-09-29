import 'server-only'
import * as z from 'zod'
import { CommentSchema, MoreSchema } from './generated'
import { MediaMetadata } from './media'
import { thing } from './things'

/** A comment (`t1`). `replies` is `""` or a Listing, parsed recursively by the comment mapper. */
export const Comment = CommentSchema.pick({
  id: true,
  name: true,
  author: true,
  body: true,
  body_html: true,
  created_utc: true,
  edited: true,
  score: true,
  score_hidden: true,
  likes: true,
  saved: true,
  stickied: true,
  locked: true,
  archived: true,
  collapsed: true,
  collapsed_reason_code: true,
  is_submitter: true,
  distinguished: true,
  parent_id: true,
  link_id: true,
  permalink: true,
  subreddit: true,
  author_flair_text: true,
  author_flair_background_color: true,
  author_flair_text_color: true,
  // Present on comments listed outside their thread (saved items, profiles).
  depth: true,
  link_title: true,
  link_permalink: true,
  over_18: true,
}).extend({
  distinguished: z.string().nullish(),
  collapsed_reason_code: z.string().nullish(),
  author_flair_text: z.string().nullish(),
  author_flair_background_color: z.string().nullish(),
  author_flair_text_color: z.string().nullish(),
  replies: z.unknown(),
  media_metadata: MediaMetadata.nullish(),
})

/** A "load more" or "continue this thread" (count 0) placeholder. */
export const More = MoreSchema.pick({
  id: true,
  name: true,
  parent_id: true,
  count: true,
  depth: true,
  children: true,
})

export const CommentThing = thing('t1', Comment)
export const MoreThing = thing('more', More)
export const CommentOrMore = z.discriminatedUnion('kind', [CommentThing, MoreThing])

export type RedditComment = z.infer<typeof Comment>
export type RedditMore = z.infer<typeof More>
