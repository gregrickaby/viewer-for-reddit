import type {components} from '@/lib/types/reddit-api'

// Extract the resolution type from auto-generated schema
type ImageResolution = NonNullable<
  NonNullable<
    NonNullable<
      NonNullable<
        components['schemas']['GetSubredditPostsResponse']['data']
      >['children']
    >[number]['data']
  >['preview']
>['images']

type Resolution = NonNullable<
  NonNullable<ImageResolution>[number]['resolutions']
>[number]

/**
 * Helper function to get the medium sized image.
 */
export function getMediumImage(images: Resolution[]): Resolution | null {
  // If there are no images, return null.
  if (!Array.isArray(images) || images.length === 0) {
    return null
  }

  // Find the medium sized image.
  const mediumSize = images.find((res) => res.width === 640)

  // Return the medium size, or the last image if not found.
  return mediumSize ?? images[images.length - 1]
}
