/**
 * Parses a Reddit post permalink and generates appropriate internal or external links.
 *
 * @param permalink - Reddit post permalink (e.g., "/r/programming/comments/abc123/title/")
 * @param useInternalRouting - Whether to generate internal app routes or external Reddit links
 * @returns Formatted link for the post
 *
 * @example
 * ```typescript
 * // Internal routing
 * parsePostLink("/r/programming/comments/abc123/my-post/", true)
 * // Returns: "/r/programming/comments/abc123"
 *
 * // External routing
 * parsePostLink("/r/programming/comments/abc123/my-post/", false)
 * // Returns: "https://reddit.com/r/programming/comments/abc123/my-post/"
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

  // Extract subreddit and postId from permalink: /r/{subreddit}/comments/{postId}/{title}/
  const match = permalink.match(/^\/r\/([^/]+)\/comments\/([^/]+)\//)

  if (match) {
    const [, subreddit, postId] = match
    return `/r/${subreddit}/comments/${postId}`
  }

  // Fallback to external link if parsing fails
  return `https://reddit.com${permalink}`
}
