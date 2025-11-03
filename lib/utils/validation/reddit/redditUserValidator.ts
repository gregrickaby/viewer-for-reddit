import {decodeHtmlEntities} from '@/lib/utils/validation/text/sanitizeText'

/**
 * Reddit user profile response interface.
 */
export interface RedditUserResponse {
  name: string
  icon_img?: string
  snoovatar_img?: string
  id?: string
}

/**
 * Validate Reddit user response data.
 * Ensures the response has required fields and correct types.
 *
 * @param data - Unknown data from Reddit API response
 * @returns Validated Reddit user data
 * @throws {Error} If user data is invalid or missing required fields
 *
 * @example
 * ```typescript
 * const userData = await fetch('/api/v1/me').then(r => r.json())
 * const validated = validateRedditUser(userData)
 * ```
 *
 * @security
 * - Validates required fields exist and have correct types
 * - Sanitizes invalid optional fields
 * - Prevents type confusion attacks
 */
export function validateRedditUser(data: unknown): RedditUserResponse {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid user data structure')
  }

  const user = data as Record<string, unknown>

  if (!user.name || typeof user.name !== 'string' || user.name.length === 0) {
    throw new Error('Invalid username in Reddit response')
  }

  // Validate and sanitize optional fields
  if (user.icon_img && typeof user.icon_img !== 'string') {
    delete user.icon_img
  }

  if (user.snoovatar_img && typeof user.snoovatar_img !== 'string') {
    delete user.snoovatar_img
  }

  return {
    name: user.name,
    icon_img: user.icon_img as string | undefined,
    snoovatar_img: user.snoovatar_img as string | undefined,
    id: user.id as string | undefined
  }
}

/**
 * Extract and validate avatar URL from Reddit user data.
 * Prefers snoovatar, falls back to icon_img.
 * Only accepts HTTPS URLs for security.
 *
 * @param user - Validated Reddit user data
 * @returns HTTPS avatar URL or undefined
 *
 * @example
 * ```typescript
 * const avatarUrl = extractAvatarUrl(user)
 * if (avatarUrl) {
 *   setUserAvatar(avatarUrl)
 * }
 * ```
 *
 * @security
 * - Only accepts HTTPS URLs (rejects HTTP)
 * - Decodes HTML entities in URLs
 * - Returns undefined for invalid URLs
 */
export function extractAvatarUrl(user: RedditUserResponse): string | undefined {
  const avatarSource = user.snoovatar_img || user.icon_img
  if (!avatarSource) return undefined

  const decoded = decodeHtmlEntities(avatarSource)

  // Security: Only accept HTTPS URLs
  return decoded.startsWith('https://') ? decoded : undefined
}
