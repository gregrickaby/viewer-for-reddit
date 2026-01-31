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
 * @returns Formatted string (e.g., "5m ago", "2h ago", "3y ago")
 */
export function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor(Date.now() / 1000 - timestamp)
  if (seconds < 60) return `${seconds}s ago`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  if (seconds < 31536000) return `${Math.floor(seconds / 86400)}d ago`
  return `${Math.floor(seconds / 31536000)}y ago`
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
  // IMPORTANT: Decode &amp; LAST to prevent double-unescaping
  // (e.g., &amp;lt; should become &lt;, not <)
  return html
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&apos;', "'")
    .replaceAll('&#39;', "'")
    .replaceAll('&#x27;', "'")
    .replaceAll('&#x2F;', '/')
    .replaceAll('&#47;', '/')
    .replaceAll('&amp;', '&') // Decode ampersand LAST
}

/**
 * Convert image URLs in links to actual img tags
 * @param html - HTML string potentially containing image links
 * @returns HTML with image links converted to img tags
 */
export function convertImageLinksToImages(html: string): string {
  // Match <a> tags that link to image URLs
  const imageLinkRegex =
    /<a[^>]+href="(https?:\/\/[^"]+\.(?:jpg|jpeg|png|gif|webp|gifv)[^"]*)"[^>]*>([^<]*)<\/a>/gi

  return html.replaceAll(imageLinkRegex, (match, url, text) => {
    // If the link text is the same as the URL or is empty, convert to img
    const trimmedText = text.trim()
    const isUrlAsText =
      trimmedText === url ||
      trimmedText === '' ||
      url.includes(trimmedText.replace(/^https?:\/\//, ''))

    if (isUrlAsText) {
      // Convert gifv to gif for direct display
      const imgUrl = url.replace(/\.gifv$/, '.gif')
      return `<img src="${imgUrl}" alt="Image" />`
    }

    // Keep the link if it has meaningful link text
    return match
  })
}

/**
 * Sanitize HTML with sanitize-html and allow safe tags
 * @param html - HTML string to sanitize
 * @returns Sanitized HTML string
 */
export function sanitizeText(html: string): string {
  // First convert image links to img tags
  const processedHtml = convertImageLinksToImages(html || '')

  return sanitizeHtml(processedHtml, {
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
      'td',
      'img'
    ],
    allowedAttributes: {
      a: ['href', 'title', 'target', 'rel'],
      img: ['src', 'alt', 'title', 'width', 'height'],
      '*': ['class']
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    allowedSchemesByTag: {
      img: ['http', 'https']
    }
  })
}
