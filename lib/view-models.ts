/*
 * Plain, serializable types that Server Components render (docs/design.md §7).
 * The UI never sees raw Reddit objects. This module holds types only, so client
 * islands may import from it.
 */

/**
 * Sanitized HTML. Only `lib/reddit/sanitize.ts` can produce one; it is rendered
 * only by `components/reddit-html.tsx`.
 */
export type SafeHtml = string & { readonly __brand: 'SafeHtml' }

/** Reddit's `likes`: true → 1, false → -1, null → 0. */
export type Vote = -1 | 0 | 1
