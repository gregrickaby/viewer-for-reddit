'use client'

import type {AutoPostChildData} from '@/lib/store/services/postsApi'
import {useMemo} from 'react'

/**
 * Gallery item with normalized image data.
 */
export interface GalleryItem {
  id: string
  url: string
  width: number
  height: number
  caption?: string
}

/**
 * useGalleryData
 *
 * Extracts and normalizes gallery data from Reddit posts.
 * Reddit galleries store data in two fields:
 * - `gallery_data.items`: Array defining the order of media items
 * - `media_metadata`: Object with actual image/video data keyed by media_id
 *
 * @param post - The Reddit post object (AutoPostChildData)
 * @returns Array of gallery items with normalized data, or null if not a gallery
 *
 * @example
 * ```ts
 * const galleryItems = useGalleryData(post)
 * if (galleryItems) {
 *   // Render gallery
 * }
 * ```
 */
export function useGalleryData(
  post: Readonly<AutoPostChildData>
): GalleryItem[] | null {
  return useMemo(() => {
    const galleryData = (post as any).gallery_data
    const mediaMetadata = (post as any).media_metadata

    // Not a gallery or missing required data
    if (!galleryData?.items || !mediaMetadata) {
      return null
    }

    const items: GalleryItem[] = []

    for (const item of galleryData.items) {
      const mediaId = item.media_id
      const metadata = mediaMetadata[mediaId]

      if (!metadata) continue

      // Extract image data from metadata
      // Reddit provides multiple resolutions, we want the source (largest)
      const source = metadata.s // Source image data
      const preview = metadata.p // Preview images array

      // Try to get the best quality image
      let imageUrl = source?.u || source?.gif
      let width = source?.x || 0
      let height = source?.y || 0

      // Fallback to largest preview if source not available
      if (!imageUrl && preview && preview.length > 0) {
        const largestPreview = preview.at(-1)
        imageUrl = largestPreview?.u
        width = largestPreview?.x || 0
        height = largestPreview?.y || 0
      }

      if (!imageUrl) continue

      // Decode HTML entities in URL
      const decodedUrl = imageUrl.replaceAll('&amp;', '&')

      items.push({
        id: mediaId,
        url: decodedUrl,
        width,
        height,
        caption: item.caption || undefined
      })
    }

    return items.length > 0 ? items : null
  }, [(post as any).gallery_data, (post as any).media_metadata])
}
