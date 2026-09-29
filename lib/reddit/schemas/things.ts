import 'server-only'
import * as z from 'zod'

/*
 * Hand-written generic envelopes (docs/design.md §7). quicktype handles
 * generics and recursion poorly, so these are never generated.
 */

/** `{ kind, data }` with a literal kind, so unions can discriminate on it. */
export const thing = <K extends string, T extends z.ZodType>(kind: K, data: T) =>
  z.object({ kind: z.literal(kind), data })

/**
 * A listing whose children are left unparsed. `lib/reddit/listing.ts` parses
 * each child on its own, so one bad item never fails the page.
 */
export const ListingEnvelope = z.object({
  kind: z.literal('Listing'),
  data: z.object({
    after: z.string().nullish(),
    before: z.string().nullish(),
    children: z.array(z.unknown()),
  }),
})

/** A Reddit fullname such as `t3_abc123`. */
export const Fullname = z.string().regex(/^t[1-6]_[a-z0-9]+$/)
