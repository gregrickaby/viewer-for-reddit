import {GalleryItem, RedditPost} from '@/lib/types/reddit'

/**
 * Validate that a URL is safe and comes from allowed domains
 * @param url - URL to validate
 * @returns True if URL is safe
 */
export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url)

    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return false
    }

    // Allow Reddit domains and common image/video hosts
    const allowedDomains = [
      'reddit.com',
      'redd.it',
      'redditstatic.com',
      'redditmedia.com',
      'v.redd.it',
      'i.redd.it',
      'external-preview.redd.it',
      'preview.redd.it'
    ]

    const hostname = parsed.hostname.toLowerCase()
    const isAllowed = allowedDomains.some(
      (domain) => hostname === domain || hostname.endsWith(`.${domain}`)
    )

    return isAllowed
  } catch {
    return false
  }
}

/**
 * Get the medium-sized image (640px) from Reddit preview resolutions
 * Falls back to the largest available resolution if 640px not found
 * @param post - Reddit post data
 * @returns Object with URL and dimensions, or null if not available
 */
export function getMediumImage(
  post: RedditPost
): {url: string; width: number; height: number} | null {
  const resolutions = post.preview?.images?.[0]?.resolutions

  if (!Array.isArray(resolutions) || resolutions.length === 0) {
    return null
  }

  // Find the 640px width resolution (medium size)
  const mediumSize = resolutions.find((res) => res.width === 640)

  // Return the medium size, or the last (largest) image if not found
  const image = mediumSize ?? resolutions.at(-1)

  if (!image?.url) {
    return null
  }

  return {
    url: image.url,
    width: image.width,
    height: image.height
  }
}

/**
 * Decode HTML entities in image URLs to fix double-encoding issues
 * @param url - URL string that may contain HTML entities
 * @returns Decoded URL
 */
export function decodeImageUrl(url: string): string {
  return url.replaceAll('&amp;', '&')
}

/**
 * Get MP4 video URL from preview variants (for animated gifs)
 * @param post - Reddit post data
 * @returns MP4 video URL or null if not available
 */
export function getMp4Variant(post: RedditPost): string | null {
  const mp4Variant = post.preview?.images?.[0]?.variants?.mp4
  const url = mp4Variant?.source?.url
  return url ? decodeImageUrl(url) : null
}

/**
 * Check if an image is vertical (portrait orientation)
 * @param width - Image width
 * @param height - Image height
 * @returns True if the image is vertical
 */
export function isVerticalImage(
  width: number | undefined,
  height: number | undefined
): boolean {
  if (!width || !height) return false
  return height > width
}

/**
 * Extract gallery items from Reddit post gallery data
 * @param post - Reddit post with gallery data
 * @returns Array of gallery items or null if not a gallery
 */
export function extractGalleryItems(post: RedditPost): GalleryItem[] | null {
  if (!post.is_gallery || !post.gallery_data || !post.media_metadata) {
    return null
  }

  const items: GalleryItem[] = []

  for (const item of post.gallery_data.items) {
    const mediaId = item.media_id
    const metadata = post.media_metadata[mediaId]

    if (!metadata) continue

    const source = metadata.s
    const preview = metadata.p

    let imageUrl = source?.u || source?.gif
    let width = source?.x || 0
    let height = source?.y || 0

    if (!imageUrl && preview && preview.length > 0) {
      const largestPreview = preview.at(-1)
      imageUrl = largestPreview?.u
      width = largestPreview?.x || 0
      height = largestPreview?.y || 0
    }

    if (!imageUrl) continue

    const decodedUrl = decodeImageUrl(imageUrl)

    items.push({
      id: mediaId,
      url: decodedUrl,
      width,
      height,
      caption: item.caption
    })
  }

  return items.length > 0 ? items : null
}

/**
 * Check if thumbnail is valid and renderable.
 * @param thumbnail - Thumbnail URL from Reddit post
 * @returns True if thumbnail is valid
 */
export function isValidThumbnail(thumbnail: string | undefined): boolean {
  return !!(
    thumbnail &&
    thumbnail !== 'self' &&
    thumbnail !== 'default' &&
    thumbnail.startsWith('http')
  )
}
