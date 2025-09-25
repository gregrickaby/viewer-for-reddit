'use client'

import {getCachedUrl} from '@/lib/utils/mediaCache'
import {Anchor} from '@mantine/core'
import {useInViewport} from '@mantine/hooks'
import {useCallback, useRef, useState} from 'react'

interface ResponsiveImageProps {
  alt?: string
  src: string | null | undefined
}

/**
 * ResponsiveImage component for lazy-loading and optimizing Reddit post images.
 *
 * Features:
 * - Uses intersection observer (useInViewport) for lazy/eager loading
 * - Dynamically sets object-fit (cover/contain) based on image aspect ratio
 * - Caches image URLs for performance (getCachedUrl)
 * - Opens full image in a new tab with accessible link
 * - Handles missing/invalid src gracefully
 * - Decodes HTML entities in URLs to fix double-encoding issues
 *
 * @param src - The image URL (string, may be null/undefined)
 * @param alt - The alt text for accessibility (optional)
 * @returns JSX.Element for a responsive, performant image link
 */
export function ResponsiveImage({
  alt = '',
  src
}: Readonly<ResponsiveImageProps>) {
  const {ref, inViewport} = useInViewport()
  const imgRef = useRef<HTMLImageElement | null>(null)
  const [responsiveClass, setResponsiveClass] = useState<'contain' | 'cover'>(
    'contain'
  )

  // Decode HTML entities in the URL to fix double-encoding issues from Reddit API.
  const decodedSrc = src ? src.replace(/&amp;/g, '&') : src

  const handleLoad = useCallback(() => {
    const img = imgRef.current
    if (!img) return

    const ratio = img.naturalWidth / img.naturalHeight
    // Use contain by default to show full image, only use cover for square-ish images
    const fit = ratio >= 0.9 && ratio <= 1.1 ? 'cover' : 'contain'
    setResponsiveClass(fit)
  }, [])

  return (
    <Anchor
      aria-label="view full image"
      href={decodedSrc ?? ''}
      ref={ref}
      rel="noopener noreferrer"
      target="_blank"
    >
      <img
        alt={alt}
        style={{objectFit: responsiveClass as React.CSSProperties['objectFit']}}
        decoding="async"
        loading={inViewport ? 'eager' : 'lazy'}
        onLoad={handleLoad}
        ref={imgRef}
        src={getCachedUrl(decodedSrc ?? '')}
      />
    </Anchor>
  )
}
