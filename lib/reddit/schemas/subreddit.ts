import 'server-only'
import * as z from 'zod'
import { SubredditSchema } from './generated'
import { thing } from './things'

/**
 * A subreddit (`t5`). Followed users appear as `t5` too, with
 * `subreddit_type: "user"` and `display_name: "u_<name>"` (design §6.3).
 */
export const Subreddit = SubredditSchema.pick({
  id: true,
  name: true,
  display_name: true,
  display_name_prefixed: true,
  title: true,
  url: true,
  subreddit_type: true,
  created_utc: true,
  public_description_html: true,
  subscribers: true,
  over18: true,
  quarantine: true,
  user_is_subscriber: true,
  user_has_favorited: true,
  icon_img: true,
  community_icon: true,
  banner_img: true,
  banner_background_image: true,
  primary_color: true,
  key_color: true,
}).extend({
  public_description_html: z.string().nullish(),
  subscribers: z.number().nullish(),
  over18: z.boolean().nullish(),
  quarantine: z.boolean().nullish(),
  user_is_subscriber: z.boolean().nullish(),
  user_has_favorited: z.boolean().nullish(),
  icon_img: z.string().nullish(),
  community_icon: z.string().nullish(),
  banner_img: z.string().nullish(),
  banner_background_image: z.string().nullish(),
  primary_color: z.string().nullish(),
  key_color: z.string().nullish(),
})

export const SubredditThing = thing('t5', Subreddit)

export type RedditSubreddit = z.infer<typeof Subreddit>
