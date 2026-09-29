import 'server-only'
import * as z from 'zod'
import { LabeledMultiSchema } from './generated'
import { thing } from './things'

/** A multireddit, from `/api/multi/mine` and `/api/multi/{path}`. */
export const Multi = LabeledMultiSchema.pick({
  name: true,
  display_name: true,
  owner: true,
  path: true,
  visibility: true,
  description_md: true,
  description_html: true,
  icon_url: true,
  key_color: true,
  over_18: true,
  can_edit: true,
  created_utc: true,
  num_subscribers: true,
  subreddits: true,
}).extend({
  description_md: z.string().optional(),
  description_html: z.string().nullish(),
  icon_url: z.string().nullish(),
  key_color: z.string().nullish(),
  over_18: z.boolean().optional(),
  num_subscribers: z.number().optional(),
  // Each entry also carries a `data` snapshot of the subreddit, which we don't need.
  subreddits: z.array(z.object({ name: z.string() })),
})

export const MultiThing = thing('LabeledMulti', Multi)

export type RedditMulti = z.infer<typeof Multi>
