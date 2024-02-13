import {ImageAsset} from '@/lib/types'

/**
 * Helper function to get the medium sized image.
 */
export function getMediumImage(images: ImageAsset[]): ImageAsset | null {
  if (!Array.isArray(images) || images.length === 0) {
    return null
  }
  const mediumSize = images.find((res) => res.width === 640)
  return mediumSize || images[images.length - 1]
}

/**
 * Helper function to get the time in "___ ago" format.
 */
export function getTimeAgo(timestampInSeconds: number): string {
  const secondsElapsed = Date.now() / 1000 - timestampInSeconds
  const minutesElapsed = Math.floor(secondsElapsed / 60)
  const hoursElapsed = Math.floor(secondsElapsed / 3600)
  const daysElapsed = Math.floor(secondsElapsed / 86400)
  const monthsElapsed = Math.floor(secondsElapsed / 2592000)
  const yearsElapsed = Math.floor(secondsElapsed / 31536000)

  if (minutesElapsed < 1) {
    return 'just now'
  } else if (minutesElapsed < 60) {
    return `${minutesElapsed}m ago`
  } else if (hoursElapsed < 24) {
    return `${hoursElapsed}h ago`
  } else if (daysElapsed < 30) {
    return `${daysElapsed}d ago`
  } else if (monthsElapsed < 12) {
    return `${monthsElapsed}mo ago`
  } else {
    return `${yearsElapsed}y ago`
  }
}
