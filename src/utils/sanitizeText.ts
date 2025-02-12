import sanitizeHtml from 'sanitize-html'

/**
 * Sanitize text with sanitize-html and remove any HTML or encoded entities.
 *
 * @param text - The text to sanitize.
 */
export function sanitizeText(text: string): string {
  return sanitizeHtml(text || '', {
    allowedTags: [
      'b',
      'i',
      'strong',
      'em',
      'a',
      'p',
      'br',
      'ul',
      'ol',
      'li',
      'blockquote',
      'code',
      'pre'
    ],
    allowedAttributes: { a: ['href', 'target'] },
    parser: { decodeEntities: true }
  })
}
