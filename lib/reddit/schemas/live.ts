import 'server-only'
import * as z from 'zod'
import { thing } from './things'

/*
 * Live threads (`/live/{id}`), hand-written from real responses: Reddit doesn't
 * document these shapes. Only the fields the app shows are kept.
 */

export const LiveEvent = z.object({
  id: z.string(),
  title: z.string(),
  description_html: z.string().nullish(),
  resources_html: z.string().nullish(),
  state: z.string(),
  viewer_count: z.number().nullish(),
  nsfw: z.boolean().default(false),
  created_utc: z.number(),
})

export const LiveEventThing = thing('LiveUpdateEvent', LiveEvent)

export const LiveUpdate = z.object({
  name: z.string(),
  author: z.string().nullish(),
  body_html: z.string().nullish(),
  created_utc: z.number(),
  stricken: z.boolean().default(false),
})

export const LiveUpdateThing = thing('LiveUpdate', LiveUpdate)

export type RedditLiveEvent = z.infer<typeof LiveEvent>
export type RedditLiveUpdate = z.infer<typeof LiveUpdate>
