/**
 * Generates a URL-friendly slug from a post title for use in permalinks.
 *
 * Converts the title to lowercase, replaces spaces with underscores,
 * removes special characters, and truncates to a reasonable length.
 *
 * @param title - The post title to convert
 * @returns URL-friendly slug
 *
 * @example
 * ```typescript
 * generatePostSlug("Padres' Dugout Reaction to Umpires!")
 * // Returns: "padres_dugout_reaction_to_umpires"
 *
 * generatePostSlug("This is a very long title that needs to be truncated because it exceeds our limit")
 * // Returns: "this_is_a_very_long_title_that_needs_to_be_truncated_because_it"
 * ```
 */
export function generatePostSlug(title: string | undefined): string {
  if (!title) {
    return ''
  }

  // Process the title step by step
  let slug = title
    .toLowerCase()
    // Replace spaces and hyphens with underscores
    .replaceAll(/[\s-]/g, '_')
    // Remove special characters except underscores
    .replaceAll(/[^\w]/g, '')

  // Collapse multiple underscores into one (keep looping until no more doubles)
  while (slug.includes('__')) {
    slug = slug.replaceAll('__', '_')
  }

  // Trim leading and trailing underscores using string methods (no regex)
  while (slug.startsWith('_')) {
    slug = slug.slice(1)
  }
  while (slug.endsWith('_')) {
    slug = slug.slice(0, -1)
  }

  // Truncate to 70 characters
  slug = slug.substring(0, 70)

  // Remove trailing underscore if truncation created one
  if (slug.endsWith('_')) {
    slug = slug.slice(0, -1)
  }

  return slug
}
