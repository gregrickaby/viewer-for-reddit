import {Source} from '@/lib/types/posts'

/**
 * Helper function to get the medium sized image.
 */
export function getMediumImage(images: Source[]): Source | null {
  // If there are no images, return null.
  if (!Array.isArray(images) || images.length === 0) {
    return null
  }

  // Find the medium sized image.
  const mediumSize = images.find((res) => res.width === 640)

  // Return the medium size, or the last image if not found.
  return mediumSize ?? images[images.length - 1]
}
