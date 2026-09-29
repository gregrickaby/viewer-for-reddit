import 'server-only'
import * as z from 'zod'
import { ListingEnvelope } from './things'

/*
 * Response envelopes for endpoints that don't return a plain Listing.
 * Their items are still parsed per item with the curated thing schemas.
 */

/** `/comments/{id}`: the post listing, then the comment listing. */
export const CommentsResponse = z.tuple([ListingEnvelope, ListingEnvelope])

/** `[code, message, field]`, for example `["THREAD_LOCKED", "that thread is locked", "parent"]`. */
export const FormError = z.tuple([z.string(), z.string()], z.string().nullable())

/**
 * The `api_type=json` envelope used by `/api/comment`, `/api/editusertext`,
 * and `/api/morechildren`. `data.things` holds `t1`/`more` things.
 */
export const FormResponse = z.object({
  json: z.object({
    errors: z.array(FormError),
    data: z.object({ things: z.array(z.unknown()) }).optional(),
  }),
})

/** `/api/multi/mine`: a bare array of `LabeledMulti` things. */
export const MultiListResponse = z.array(z.unknown())

/** Vote, save, subscribe, and similar writes return `{}`. */
export const EmptyResponse = z.object({}).loose()

export type RedditFormError = z.infer<typeof FormError>
