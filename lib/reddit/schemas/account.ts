import 'server-only'
import * as z from 'zod'
import { AccountSchema, DataClassSchema, MeSchema } from './generated'
import { thing } from './things'

/** The profile subreddit (`u_<name>`) that carries a user's follow state and bio. */
const ProfileSubreddit = DataClassSchema.pick({
  display_name: true,
  title: true,
  public_description: true,
  over_18: true,
  user_is_subscriber: true,
  banner_img: true,
}).extend({
  title: z.string().nullish(),
  public_description: z.string().nullish(),
  over_18: z.boolean().nullish(),
  user_is_subscriber: z.boolean().nullish(),
  banner_img: z.string().nullish(),
})

/** Another user's account (`t2`), from `/user/{name}/about`. */
export const Account = AccountSchema.pick({
  id: true,
  name: true,
  created_utc: true,
  icon_img: true,
  snoovatar_img: true,
  total_karma: true,
  link_karma: true,
  comment_karma: true,
  verified: true,
  is_gold: true,
  subreddit: true,
}).extend({
  icon_img: z.string().nullish(),
  snoovatar_img: z.string().nullish(),
  total_karma: z.number().optional(),
  verified: z.boolean().optional(),
  is_gold: z.boolean().optional(),
  subreddit: ProfileSubreddit.nullish(),
})

/** The signed-in user, from `/api/v1/me`. Zod strips the private fields we never read. */
export const Me = MeSchema.pick({
  id: true,
  name: true,
  created_utc: true,
  icon_img: true,
  snoovatar_img: true,
  total_karma: true,
  over_18: true,
}).extend({
  icon_img: z.string().nullish(),
  snoovatar_img: z.string().nullish(),
  total_karma: z.number().optional(),
  over_18: z.boolean().optional(),
})

export const AccountThing = thing('t2', Account)

/** Reddit returns only the name for a suspended account. */
export const SuspendedAccount = z.object({ name: z.string(), is_suspended: z.literal(true) })

export const ProfileThing = thing('t2', z.union([SuspendedAccount, Account]))

export type RedditAccount = z.infer<typeof Account>
export type RedditMe = z.infer<typeof Me>
