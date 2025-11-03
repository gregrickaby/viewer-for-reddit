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
 * Removes potentially dangerous HTML elements and attributes while preserving
 * safe formatting like paragraphs, links, lists, and basic text styling.
 * Uses the sanitize-html library with a predefined allowlist of safe elements.
 *
 * @param text - The text content to sanitize (may contain HTML)
 * @returns Sanitized text with only safe HTML tags preserved
 *
 * @example
 * ```typescript
 * const clean = sanitizeText('<p>Hello <script>alert("xss")</script></p>')
 * // Returns: '<p>Hello </p>'
 * ```
 *
 * @security
 * - Removes dangerous tags like script, iframe, object
 * - Filters attributes to prevent JavaScript injection
 * - Enables entity decoding for proper text display
 */
export function sanitizeText(text: string): string {
  return sanitizeHtml(text || '', BASE_OPTIONS)
}

/**
 * Decodes HTML entities manually for cross-environment compatibility.
 *
 * Provides a lightweight HTML entity decoder that works consistently across
 * browser and server environments. Handles the most common entities returned
 * by Reddit's API without requiring a full DOM parser.
 *
 * @param str - String containing HTML entities to decode
 * @returns String with HTML entities converted to their character equivalents
 *
 * @example
 * ```typescript
 * const decoded = decodeHtmlEntities('&lt;Hello &amp; goodbye&gt;')
 * // Returns: '<Hello & goodbye>'
 * ```
 */
export function decodeHtmlEntities(str: string): string {
  return str.replaceAll(
    /&(?:#x?[0-9a-fA-F]+|[a-zA-Z][a-zA-Z0-9]*);/g,
    (entity) => HTML_ENTITY_MAP[entity] || entity
  )
}

/**
 * Validates that a URL is safe for use in links.
 * Only allows http/https protocols to prevent javascript: and other dangerous protocols.
 *
 * @param url - URL to validate
 * @returns True if URL is safe, false otherwise
 */
function isValidUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false

  try {
    const parsedUrl = new URL(url)
    return ['http:', 'https:'].includes(parsedUrl.protocol)
  } catch {
    // Handle relative URLs
    return url.startsWith('/') || url.startsWith('#')
  }
}

/**
 * Decodes Reddit's double-encoded HTML and sanitizes it for safe DOM insertion.
 *
 * Reddit's API returns HTML content that is double-encoded (HTML entities are
 * encoded again). This function first decodes the entities back to HTML,
 * then sanitizes the resulting HTML for safe browser rendering. All links
 * are automatically configured to open in new tabs with security attributes.
 *
 * @param encodedHtml - Double-encoded HTML string from Reddit API (e.g., `body_html`)
 * @returns Sanitized HTML string safe for dangerouslySetInnerHTML
 *
 * @example
 * ```typescript
 * const redditHtml = '&lt;p&gt;Check out &lt;a href="https://example.com"&gt;this link&lt;/a&gt;&lt;/p&gt;'
 * const safe = decodeAndSanitizeHtml(redditHtml)
 * // Returns: '<p>Check out <a href="https://example.com" target="_blank" rel="noopener noreferrer">this link</a></p>'
 * ```
 *
 * @security
 * - Decodes double-encoded HTML entities from Reddit API
 * - Applies comprehensive HTML sanitization
 * - Validates all URLs to prevent javascript: and data: protocol attacks
 * - Forces all links to open in new tabs with security attributes
 * - Prevents XSS attacks through malicious HTML content
 */
export function decodeAndSanitizeHtml(encodedHtml: string): string {
  if (!encodedHtml) return ''

  // First decode the HTML entities manually
  // This converts "&lt;p&gt;" back to "<p>"
  const decoded = decodeHtmlEntities(encodedHtml)

  // Then sanitize the decoded HTML with enhanced security
  return sanitizeHtml(decoded, {
    ...BASE_OPTIONS,
    // Enhanced URL filtering to prevent protocol-based attacks
    allowedSchemes: ['http', 'https'],
    allowedSchemesByTag: {
      a: ['http', 'https']
    },
    // Force anchors to open in a new tab and add safe rel attributes
    transformTags: {
      a: (_tagName, attribs) => {
        const href = attribs.href

        // If href is missing or empty, provide a safe placeholder
        if (!href) {
          return {
            tagName: 'a',
            attribs: {
              href: '#',
              target: '_blank',
              rel: 'noopener noreferrer'
            }
          }
        }

        // Validate URL safety - if invalid, convert to safe placeholder
        if (!isValidUrl(href)) {
          return {
            tagName: 'a',
            attribs: {
              href: '#',
              target: '_blank',
              rel: 'noopener noreferrer'
            }
          }
        }

        return {
          tagName: 'a',
          attribs: {
            href,
            target: '_blank',
            rel: 'noopener noreferrer'
          }
        }
      }
    }
  })
}
