/**
 * Parses a Reddit post permalink and generates appropriate internal or external links.
 *
 * @param permalink - Reddit post permalink (e.g., "/r/programming/comments/abc123/title/")
 * @param useInternalRouting - Whether to generate internal app routes or external Reddit links
 * @returns Formatted link for the post
 *
 * @example
 * ```typescript
 * // Internal routing - preserves title in URL for SEO
 * parsePostLink("/r/programming/comments/abc123/my_awesome_post/", true)
 * // Returns: "/r/programming/comments/abc123/my_awesome_post/"
 *
 * // External routing
 * parsePostLink("/r/programming/comments/abc123/my_awesome_post/", false)
 * // Returns: "https://reddit.com/r/programming/comments/abc123/my_awesome_post/"
 * ```
 */
export function parsePostLink(
  permalink: string | undefined,
  useInternalRouting: boolean
): string {
  // Always return external link if not using internal routing
  if (!useInternalRouting) {
    return `https://reddit.com${permalink}`
  }

  // Handle missing permalink
  if (!permalink) {
    return '#'
  }

  // For internal routing, preserve the full permalink including title
  // This supports SEO-friendly URLs like /r/baseball/comments/1nwopua/padres_dugout_reaction/
  // The [[...slug]] route parameter handles backward compatibility for URLs without titles
  return permalink
}
