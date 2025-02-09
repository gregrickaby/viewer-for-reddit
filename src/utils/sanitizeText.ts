import sanitizeHtml from 'sanitize-html'

/**
 * Sanitize text with sanitize-html and remove any HTML or encoded entities.
 *
 * @param text - The text to sanitize.
 */
export function sanitizeText(text: string): string {
  // If there is no text, return an empty string.
  if (!text) {
    return ''
  }

  return sanitizeHtml(text, {
    allowedTags: [], // No HTML tags allowed
    allowedAttributes: {}, // No attributes allowed
    parser: {
      decodeEntities: true // Decode HTML entities
    }
  })
}
