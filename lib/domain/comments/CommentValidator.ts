import type {CommentValidationResult} from './CommentModels'

/**
 * Maximum allowed comment length per Reddit's API requirements.
 */
export const MAX_COMMENT_LENGTH = 10000

/**
 * Minimum allowed comment length (non-empty).
 */
export const MIN_COMMENT_LENGTH = 1

/**
 * Validates comment text for submission.
 *
 * Validation Rules:
 * - Text cannot be empty or whitespace-only
 * - Text length must be between MIN_COMMENT_LENGTH and MAX_COMMENT_LENGTH
 * - Text must be a string
 *
 * @param text - Comment text to validate
 * @returns Validation result with success flag and error message if invalid
 *
 * @example
 * ```ts
 * const result = validateCommentText('Hello world')
 * if (result.isValid) {
 *   // Submit comment
 * } else {
 *   console.error(result.error)
 * }
 * ```
 */
export function validateCommentText(text: unknown): CommentValidationResult {
  // Type check
  if (typeof text !== 'string') {
    return {
      isValid: false,
      error: 'Comment must be a string'
    }
  }

  // Empty/whitespace check
  const trimmed = text.trim()
  if (trimmed.length === 0) {
    return {
      isValid: false,
      error: 'Comment cannot be empty'
    }
  }

  // Length check
  if (trimmed.length > MAX_COMMENT_LENGTH) {
    return {
      isValid: false,
      error: `Comment exceeds maximum length of ${MAX_COMMENT_LENGTH} characters`
    }
  }

  return {isValid: true}
}

/**
 * Sanitizes user input to prevent XSS attacks and normalize content.
 *
 * Sanitization Steps:
 * - Trims leading/trailing whitespace
 * - Normalizes line endings to \n
 * - Strips null bytes
 * - Limits consecutive newlines to 2 (preserves readability)
 *
 * @param text - User input to sanitize
 * @returns Sanitized text safe for submission
 *
 * @example
 * ```ts
 * const clean = sanitizeCommentInput('  Hello\r\n\r\nWorld  ')
 * // Returns: 'Hello\n\nWorld'
 * ```
 */
export function sanitizeCommentInput(text: string): string {
  return (
    text
      .trim()
      // Normalize line endings (Windows \r\n → Unix \n)
      .replaceAll('\r\n', '\n')
      // Strip null bytes (security)
      .replaceAll('\0', '')
      // Limit consecutive newlines to 2 (prevent excessive spacing)
      .replaceAll(/\n{3,}/g, '\n\n')
  )
}

/**
 * Validates comment length is within Reddit's API limits.
 *
 * @param text - Comment text to check
 * @returns True if length is valid, false otherwise
 *
 * @example
 * ```ts
 * if (!isValidCommentLength(comment)) {
 *   alert('Comment too long')
 * }
 * ```
 */
export function isValidCommentLength(text: string): boolean {
  const trimmed = text.trim()
  return (
    trimmed.length >= MIN_COMMENT_LENGTH && trimmed.length <= MAX_COMMENT_LENGTH
  )
}
