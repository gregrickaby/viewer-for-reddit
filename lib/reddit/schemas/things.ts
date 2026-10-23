import 'server-only'

import * as z from 'zod'

/*
 * Hand-written generic envelopes. quicktype handles
 * generics and recursion poorly, so these are never generated.
 */

/** `{ kind, data }` with a literal kind, so unions can discriminate on it. */
export function thing<K extends string, T extends z.ZodType>(kind: K, data: T) {
  return z.object({ kind: z.literal(kind), data })
}

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
