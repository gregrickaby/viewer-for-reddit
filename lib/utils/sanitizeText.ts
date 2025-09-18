import sanitizeHtml, {IOptions} from 'sanitize-html'

/**
 * HTML tags allowed in sanitized content.
 * Includes basic formatting, lists, and structural elements.
 */
const ALLOWED_TAGS = [
  'div',
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
]

/**
 * HTML attributes allowed in sanitized content.
 * Links can have href/target/rel, all elements can have class for styling.
 */
const ALLOWED_ATTRIBUTES: IOptions['allowedAttributes'] = {
  a: ['href', 'target', 'rel'],
  '*': ['class']
}

/**
 * Base sanitization options shared across all sanitize functions.
 * Enables entity decoding and restricts to safe tags/attributes.
 */
const BASE_OPTIONS: IOptions = {
  allowedTags: ALLOWED_TAGS,
  allowedAttributes: ALLOWED_ATTRIBUTES,
  parser: {decodeEntities: true}
}

/**
 * HTML entity mapping for manual decoding.
 * Covers the most common entities returned by Reddit's API.
 */
const HTML_ENTITY_MAP: Record<string, string> = {
  '&lt;': '<',
  '&gt;': '>',
  '&amp;': '&',
  '&quot;': '"',
  '&#x27;': "'",
  '&#x2F;': '/',
  '&#x60;': '`',
  '&#x3D;': '='
}

/**
 * Sanitizes text content while preserving safe HTML markup.
 *
 * @param text - The text content to sanitize
 * @returns Sanitized text with safe HTML tags preserved
 *
 * @example
 * ```ts
 * const clean = sanitizeText('<p>Hello <script>alert("xss")</script></p>')
 * // Returns: '<p>Hello </p>'
 * ```
 */
export function sanitizeText(text: string): string {
  return sanitizeHtml(text || '', BASE_OPTIONS)
}

/**
 * Decodes HTML entities manually for cross-environment compatibility.
 */
function decodeHtmlEntities(str: string): string {
  return str.replace(/&[#\w]+;/g, (entity) => HTML_ENTITY_MAP[entity] || entity)
}

/**
 * Decodes Reddit's double-encoded HTML and sanitizes it for safe DOM insertion.
 *
 * @param encodedHtml - Double-encoded HTML string from Reddit API (e.g., `body_html`)
 * @returns Sanitized HTML string safe for dangerouslySetInnerHTML
 *
 * @example
 * ```ts
 * const redditHtml = '&lt;p&gt;Check out &lt;a href="https://example.com"&gt;this link&lt;/a&gt;&lt;/p&gt;'
 * const safe = decodeAndSanitizeHtml(redditHtml)
 * // Returns: '<p>Check out <a href="https://example.com" target="_blank" rel="noopener noreferrer">this link</a></p>'
 * ```
 */
export function decodeAndSanitizeHtml(encodedHtml: string): string {
  if (!encodedHtml) return ''

  // First decode the HTML entities manually
  // This converts "&lt;p&gt;" back to "<p>"
  const decoded = decodeHtmlEntities(encodedHtml)

  // Then sanitize the decoded HTML with enhanced link security.
  return sanitizeHtml(decoded, {
    ...BASE_OPTIONS,
    // Force anchors to open in a new tab and add safe rel attributes.
    transformTags: {
      a: (_tagName, attribs) => ({
        tagName: 'a',
        attribs: {
          href: attribs.href || '#',
          target: '_blank',
          rel: 'noopener noreferrer'
        }
      })
    }
  })
}
