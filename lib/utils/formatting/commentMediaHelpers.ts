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
    return mediaHosts.some((host) => urlObj.hostname.includes(host))
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
  if (url.includes('imgur.com') && url.endsWith('.gifv')) {
    return url.replace('.gifv', '.mp4')
  }

  // Convert imgur gallery links to direct image
  if (url.includes('imgur.com/a/')) {
    // This would need API call or scraping, for now just return as-is
    return url
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
    if (
      urlObj.hostname.includes('i.redd.it') ||
      urlObj.hostname.includes('i.imgur.com')
    ) {
      // Assume image if no extension
      return 'image'
    }
    if (
      urlObj.hostname.includes('gfycat.com') ||
      urlObj.hostname.includes('redgifs.com')
    ) {
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
export function stripMediaLinks(html: string): string {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
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
}
