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
