/**
 * Validates that the provided path is a safe and legal Reddit API path.
 *
 * Prevents SSRF attacks and path traversal by ensuring:
 * - Path starts with exactly one forward slash
 * - No parent directory references (..)
 * - No absolute URLs or protocol-relative URLs
 * - No fragment identifiers or dangerous characters
 *
 * @param path - The Reddit API path to validate (e.g., "/r/programming/hot.json")
 * @returns True if the path is safe to use, false otherwise
 *
 * @example
 * isSafeRedditPath('/r/programming/hot.json') // true
 * isSafeRedditPath('../etc/passwd') // false
 * isSafeRedditPath('//evil.com/api') // false
 * isSafeRedditPath('http://evil.com') // false
 */
export function isSafeRedditPath(path: string): boolean {
  // Must start with exactly one /
  if (!path || !path.startsWith('/') || path.startsWith('//')) return false
  // Disallow path traversal
  if (path.includes('..')) return false
  // Disallow protocol-relative, or absolute URLs
  if (path.startsWith('http:') || path.startsWith('https:')) return false
  // Disallow fragments or dangerous characters
  if (path.includes('#')) return false
  return true
}
