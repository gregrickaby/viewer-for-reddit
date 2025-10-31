/**
 * Check if a hostname matches a domain exactly or as a subdomain.
 * Prevents subdomain injection attacks (e.g., evil-i.redd.it.com)
 */
function hostnameMatches(hostname: string, domain: string): boolean {
  const lower = hostname.toLowerCase()
  const lowerDomain = domain.toLowerCase()
  return lower === lowerDomain || lower.endsWith(`.${lowerDomain}`)
}

/**
 * Detect if a URL is a supported media type (image, GIF, video)
 */
export function isMediaUrl(url: string): boolean {
  const imageExtensions = /\.(jpg|jpeg|png|gif|gifv|webp)(\?|$)/i
  const videoExtensions = /\.(mp4|webm)(\?|$)/i

  // Check direct file extensions (with or without query params)
  if (imageExtensions.test(url) || videoExtensions.test(url)) {
    return true
  }

  // Check for common image/GIF hosting domains
  const mediaHosts = [
    'i.redd.it',
    'i.imgur.com',
    'imgur.com/a/',
    'gfycat.com',
    'redgifs.com',
    'giphy.com',
    'tenor.com'
  ]

  try {
    const urlObj = new URL(url)
    return mediaHosts.some((host) => hostnameMatches(urlObj.hostname, host))
  } catch {
    return false
  }
}

/**
 * Extract media links from comment HTML
 * Returns array of {url, text} for each media link found
 */
export function extractMediaLinks(
  html: string
): Array<{url: string; text: string}> {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  const links = Array.from(doc.querySelectorAll('a[href]'))

  const mediaLinks: Array<{url: string; text: string}> = []

  for (const link of links) {
    const href = link.getAttribute('href')
    const text = link.textContent || ''

    if (href && isMediaUrl(href)) {
      mediaLinks.push({url: href, text})
    }
  }

  return mediaLinks
}

/**
 * Convert imgur gifv links to direct MP4
 */
export function normalizeMediaUrl(url: string): string {
  // Convert imgur gifv to mp4
  try {
    const urlObj = new URL(url)
    const imgurHosts = ['imgur.com', 'i.imgur.com']
    if (
      imgurHosts.some((host) => hostnameMatches(urlObj.hostname, host)) &&
      urlObj.pathname.endsWith('.gifv')
    ) {
      return url.replace('.gifv', '.mp4')
    }
  } catch {
    // Invalid URL, fall through
  }

  // Convert imgur gallery links to direct image
  try {
    const urlObj = new URL(url)
    if (
      hostnameMatches(urlObj.hostname, 'imgur.com') &&
      urlObj.pathname.startsWith('/a/')
    ) {
      // This would need API call or scraping, for now just return as-is
      return url
    }
  } catch {
    // Invalid URL, fall through
  }

  return url
}

/**
 * Get media type from URL
 */
export function getMediaType(url: string): 'image' | 'video' | 'unknown' {
  const imageExtensions = /\.(jpg|jpeg|png|webp)(\?|$)/i
  const gifExtensions = /\.(gif|gifv)(\?|$)/i
  const videoExtensions = /\.(mp4|webm)(\?|$)/i

  if (imageExtensions.test(url)) {
    return 'image'
  }

  if (gifExtensions.test(url) || videoExtensions.test(url)) {
    return 'video'
  }

  // Check domain-based detection
  try {
    const urlObj = new URL(url)
    const imageHosts = ['i.redd.it', 'i.imgur.com']
    if (imageHosts.some((host) => hostnameMatches(urlObj.hostname, host))) {
      // Assume image if no extension
      return 'image'
    }
    const videoHosts = ['gfycat.com', 'redgifs.com']
    if (videoHosts.some((host) => hostnameMatches(urlObj.hostname, host))) {
      return 'video'
    }
  } catch {
    return 'unknown'
  }

  return 'unknown'
}

/**
 * Remove media links from comment HTML
 * Returns sanitized HTML with media links removed (they'll be rendered separately as inline media)
 */
export function stripMediaLinks(bodyHtml: string): string {
  if (globalThis.window === undefined) {
    return bodyHtml
  }

  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(bodyHtml, 'text/html')
    const links = Array.from(doc.querySelectorAll('a[href]'))

    for (const link of links) {
      const href = link.getAttribute('href')

      if (href && isMediaUrl(href)) {
        // Remove the entire paragraph containing the media link if it only contains the link
        const parent = link.parentElement
        if (
          parent?.tagName === 'P' &&
          parent.textContent?.trim() === link.textContent?.trim()
        ) {
          parent.remove()
        } else {
          // Just remove the link itself
          link.remove()
        }
      }
    }

    return doc.body.innerHTML
  } catch {
    return bodyHtml
  }
}
