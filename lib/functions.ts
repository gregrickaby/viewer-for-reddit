import {ImageAsset} from '@/lib/types'

/**
 * Try to find a medium sized image.
 */
export function getMediumImage(images: ImageAsset[]): ImageAsset | null {
  // If there are no images, return null.
  if (!Array.isArray(images) || images.length === 0) {
    return null
  }

  // Try to find an image with 640px resolution.
  const mediumSize = images.find((res) => res.width === 640)

  // Return the medium sized image; otherwise, return the highest resolution.
  return mediumSize || images[images.length - 1]
}
