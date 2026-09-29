import 'server-only'
import * as z from 'zod'
import { LinkSchema } from './generated'
import { MediaMetadata, MediaObject, Preview } from './media'
import { thing } from './things'

/**
 * A post (`t3`). Picks only what the mappers read. If a picked key is missing
 * from the generated schema, typecheck fails: capture a sample that has it.
 * `extend` loosens fields that vary in production beyond our samples.
 */
export const Link = LinkSchema.pick({
  id: true,
  name: true,
  subreddit: true,
  subreddit_name_prefixed: true,
  author: true,
  title: true,
  permalink: true,
  url: true,
  domain: true,
  created_utc: true,
  edited: true,
  score: true,
  hide_score: true,
  likes: true,
  num_comments: true,
  saved: true,
  over_18: true,
  spoiler: true,
  stickied: true,
  locked: true,
  archived: true,
  is_self: true,
  is_video: true,
  thumbnail: true,
  selftext_html: true,
  post_hint: true,
  distinguished: true,
  removed_by_category: true,
  url_overridden_by_dest: true,
  link_flair_text: true,
  link_flair_background_color: true,
  link_flair_text_color: true,
  thumbnail_width: true,
  thumbnail_height: true,
  is_gallery: true,
  crosspost_parent: true,
}).extend({
  selftext_html: z.string().nullish(),
  thumbnail: z.string().optional(),
  thumbnail_width: z.number().nullish(),
  thumbnail_height: z.number().nullish(),
  distinguished: z.string().nullish(),
  removed_by_category: z.string().nullish(),
  link_flair_text: z.string().nullish(),
  link_flair_background_color: z.string().nullish(),
  link_flair_text_color: z.string().nullish(),
  preview: Preview.optional(),
  media: MediaObject.nullish(),
  secure_media: MediaObject.nullish(),
  gallery_data: z
    .object({
      items: z.array(
        z.object({
          media_id: z.string(),
          caption: z.string().optional(),
          outbound_url: z.string().optional(),
        }),
      ),
    })
    .nullish(),
  media_metadata: MediaMetadata.nullish(),
  // Parsed on demand by `crosspostParent`, one level deep.
  crosspost_parent_list: z.array(z.unknown()).optional(),
})

export const LinkThing = thing('t3', Link)

export type RedditLink = z.infer<typeof Link>

/** The original post a crosspost points at, or null. One level only. */
export function crosspostParent(link: RedditLink): RedditLink | null {
  const parsed = Link.safeParse(link.crosspost_parent_list?.[0])
  return parsed.success ? parsed.data : null
}
