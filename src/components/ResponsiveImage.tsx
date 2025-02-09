import { memo, useCallback, useRef } from 'react'
import { getCachedUrl } from '../utils/cache'

/**
 * Props for the ResponsiveImage component.
 */
interface ResponsiveImageProps {
  /* Main image URL */
  src: string
  /* Low-res thumbnail for blur-up effect */
  thumbnail?: string
  /* Alt text for accessibility */
  alt?: string
}

/**
 * ResponsiveImage Component.
 *
 * Renders an image with the following features:
 * - Automatic aspect ratio detection
 * - Dynamic object-fit adjustment based on aspect ratio
 * - Blur-up loading effect with thumbnail
 * - Lazy loading for better performance
 * - Cached URL handling
 */
export const ResponsiveImage = memo(function ResponsiveImage({
  src,
  thumbnail,
  alt = ''
}: Readonly<ResponsiveImageProps>) {
  // Track image aspect ratio for dynamic object-fit.
  const imageAspectRatio = useRef<number>(0)

  /**
   * Handles image load event to calculate and set appropriate object-fit
   * - contain: for images with extreme aspect ratios (>1.2 or <0.8)
   * - cover: for images closer to square aspect ratio
   */
  const handleLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const img = e.currentTarget
      imageAspectRatio.current = img.naturalWidth / img.naturalHeight

      // Adjust object-fit based on aspect ratio thresholds.
      img.style.objectFit =
        imageAspectRatio.current > 1.2 || imageAspectRatio.current < 0.8
          ? 'contain' // For wide or tall images.
          : 'cover' // For roughly square images.
    },
    []
  )

  return (
    <div className="relative h-full w-full">
      {/* Blur-up thumbnail layer. */}
      {thumbnail && (
        <img
          alt=""
          className="absolute inset-0 h-full w-full scale-110 blur-3xl"
          src={getCachedUrl(thumbnail)}
        />
      )}
      {/* Main image with dynamic object-fit. */}
      <img
        alt={alt}
        className="relative h-full w-full object-cover"
        loading="lazy"
        onLoad={handleLoad}
        src={getCachedUrl(src)}
      />
    </div>
  )
})
