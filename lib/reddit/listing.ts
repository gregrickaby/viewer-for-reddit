import 'server-only'
import * as z from 'zod'
import { logger } from '@/lib/datadog/server'
import { RedditSchemaError } from './errors'
import { ListingEnvelope } from './schemas/things'

export type ParsedListing<T> = { items: T[]; after: string | null; before: string | null }

/**
 * Parses a Listing tolerantly (design N4): a bad envelope is a schema error for
 * the whole response, but a bad child is logged and dropped on its own.
 */
export function parseListing<T extends z.ZodType>(
  json: unknown,
  item: T,
  endpoint: string,
): ParsedListing<z.infer<T>> {
  const envelope = ListingEnvelope.safeParse(json)
  if (!envelope.success) throw new RedditSchemaError(endpoint, envelope.error.issues)
  const { children, after, before } = envelope.data.data
  return {
    items: parseItems(children, item, endpoint),
    after: after ?? null,
    before: before ?? null,
  }
}

/** Parses each value with `item`, logging and skipping the ones that don't fit. */
export function parseItems<T extends z.ZodType>(
  values: readonly unknown[],
  item: T,
  endpoint: string,
): z.infer<T>[] {
  const items: z.infer<T>[] = []
  for (const value of values) {
    const result = item.safeParse(value)
    if (result.success) items.push(result.data)
    else
      logger.warn('[reddit:schema]', {
        endpoint,
        item: describe(value),
        error: z.prettifyError(result.error),
      })
  }
  return items
}

/** Parses a whole response strictly: anything unexpected is a schema error. */
export function parseResponse<T extends z.ZodType>(
  json: unknown,
  schema: T,
  endpoint: string,
): z.infer<T> {
  const result = schema.safeParse(json)
  if (!result.success) throw new RedditSchemaError(endpoint, result.error.issues)
  return result.data
}

/** A short label for a dropped item, such as `t3 t3_abc123`. Never logs content. */
function describe(value: unknown): string {
  if (typeof value !== 'object' || value === null) return typeof value
  const { kind, data } = value as { kind?: unknown; data?: { name?: unknown } }
  const name = typeof data?.name === 'string' ? data.name : '?'
  return `${typeof kind === 'string' ? kind : '?'} ${name}`
}
