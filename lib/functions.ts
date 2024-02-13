import {ImageAsset} from '@/lib/types'

/**
 * Helper function to get the medium sized image.
 */
export function getMediumImage(images: ImageAsset[]): ImageAsset | null {
  // If there are no images, return null.
  if (!Array.isArray(images) || images.length === 0) {
    return null
  }

  // Find the medium sized image.
  const mediumSize = images.find((res) => res.width === 640)

  // Return the medium size, or the last image if not found.
  return mediumSize || images[images.length - 1]
}

/**
 * Helper function to get the time in "___ ago" format.
 */
export function getTimeAgo(timestampInSeconds: number): string {
  // Constants for time conversions.
  const SECOND = 1
  const MINUTE = 60 * SECOND
  const HOUR = 60 * MINUTE
  const DAY = 24 * HOUR
  const MONTH = 30 * DAY
  const YEAR = 12 * MONTH

  // Calculate elapsed time.
  const elapsedSeconds = Math.floor(Date.now() / 1000 - timestampInSeconds)

  // Return the appropriate string.
  if (elapsedSeconds < MINUTE) {
    return 'just now'
  } else if (elapsedSeconds < HOUR) {
    return `${Math.floor(elapsedSeconds / MINUTE)}m ago`
  } else if (elapsedSeconds < DAY) {
    return `${Math.floor(elapsedSeconds / HOUR)}h ago`
  } else if (elapsedSeconds < MONTH) {
    return `${Math.floor(elapsedSeconds / DAY)}d ago`
  } else if (elapsedSeconds < YEAR) {
    return `${Math.floor(elapsedSeconds / MONTH)}mo ago`
  } else {
    return `${Math.floor(elapsedSeconds / YEAR)}y ago`
  }
}
