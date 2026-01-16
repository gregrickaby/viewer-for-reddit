import sanitizeHtml from 'sanitize-html'

/**
 * Formats a number into a human-readable string with K/M suffixes
 * @param num - The number to format
 * @returns Formatted string (e.g., "1.5K", "2.3M")
 */
export function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
  return num.toString()
}

/**
 * Formats a Unix timestamp into a relative time string
 * @param timestamp - Unix timestamp in seconds
 * @returns Formatted string (e.g., "5m ago", "2h ago")
 */
export function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor(Date.now() / 1000 - timestamp)
  if (seconds < 60) return `${seconds}s ago`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

/**
 * Decodes HTML entities in a string
 * @param html - HTML string with encoded entities
 * @returns Decoded string
 */
export function decodeHtmlEntities(html: string): string {
  // Use native browser API for complete entity decoding
  if (typeof document !== 'undefined') {
    const textarea = document.createElement('textarea')
    textarea.innerHTML = html
    return textarea.value
  }

  // Server-side fallback with expanded entity support
  return html
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&amp;', '&')
    .replaceAll('&quot;', '"')
    .replaceAll('&apos;', "'")
    .replaceAll('&#39;', "'")
    .replaceAll('&#x27;', "'")
    .replaceAll('&#x2F;', '/')
    .replaceAll('&#47;', '/')
}

/**
 * Sanitize HTML with sanitize-html and allow safe tags
 * @param html - HTML string to sanitize
 * @returns Sanitized HTML string
 */
export function sanitizeText(html: string): string {
  return sanitizeHtml(html || '', {
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
      'pre',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'hr',
      'del',
      'sup',
      'sub',
      'table',
      'thead',
      'tbody',
      'tr',
      'th',
      'td'
    ],
    allowedAttributes: {
      a: ['href', 'title', 'target', 'rel'],
      '*': ['class']
    },
    allowedSchemes: ['http', 'https', 'mailto']
  })
}
