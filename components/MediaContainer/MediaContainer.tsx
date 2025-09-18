import clsx from 'clsx'
import {ReactNode} from 'react'
import styles from './MediaContainer.module.css'

interface MediaContainerProps {
  children: ReactNode
  isVertical?: boolean
}

/**
 * MediaContainer component for consistent media layout and aspect ratio.
 *
 * Wraps media elements (images, video, embeds) and applies orientation-based styling.
 *
 * Features:
 * - Applies vertical or horizontal layout classes for responsive design
 * - Ensures all media is centered and sized consistently
 * - Used by Media, HlsPlayer, ResponsiveImage, and YouTubePlayer
 *
 * @param children - The media content to render
 * @param isVertical - If true, applies vertical aspect ratio styling
 * @returns JSX.Element wrapping the media with proper layout
 */
export function MediaContainer({
  children,
  isVertical
}: Readonly<MediaContainerProps>) {
  return (
    <div
      className={clsx(
        styles.container,
        isVertical ? styles.vertical : styles.horizontal
      )}
    >
      {children}
    </div>
  )
}
