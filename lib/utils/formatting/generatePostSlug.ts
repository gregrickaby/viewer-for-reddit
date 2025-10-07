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

  return (
    title
      .toLowerCase()
      // Replace spaces and hyphens with underscores
      .replace(/[\s-]+/g, '_')
      // Remove special characters except underscores
      .replace(/[^\w]/g, '')
      // Remove leading/trailing underscores
      .replace(/(?:^_+|_+$)/g, '')
      // Collapse multiple underscores into one
      .replace(/_+/g, '_')
      // Truncate to 70 characters (reasonable length for SEO)
      .substring(0, 70)
      // Remove trailing underscore if truncation created one
      .replace(/_$/, '')
  )
}
