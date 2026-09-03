'use client'

import {useIsIntersecting} from '@/lib/hooks/useIsIntersecting'
import {getAspectRatioStyle} from '@/lib/utils/media-helpers'
import {usePathname} from 'next/navigation'
import {useRef} from 'react'
import styles from './PostMedia.module.css'

/**
 * Props for the EmbedFrame component.
 */
interface EmbedFrameProps {
  /** Iframe embed URL */
  src: string
  /** Accessible title for the iframe */
  title: string
  /** Source media width, for aspect ratio calculation */
  width?: number
  /** Source media height, for aspect ratio calculation */
  height?: number
}

/**
 * Responsive iframe embed that unmounts when scrolled out of view or when
 * the route changes. Cross-origin players (RedGifs, YouTube, etc.) expose no
 * reliable pause API, so removing the iframe is the only way to stop
 * playback - and App Router keeps a navigated-away page's components mounted
 * (just hidden) for fast back/forward navigation, so a plain unmount-on-scroll
 * check isn't enough to stop it playing in the background after navigating.
 */
export function EmbedFrame({
  src,
  title,
  width,
  height
}: Readonly<EmbedFrameProps>) {
  const [containerRef, isIntersecting] = useIsIntersecting<HTMLDivElement>()
  const pathname = usePathname()
  const mountedPathname = useRef(pathname)
  const isVisible = isIntersecting && pathname === mountedPathname.current
  const style = getAspectRatioStyle(width, height)

  return (
    <div className={styles.embedContainer} style={style} ref={containerRef}>
      {isVisible && (
        <iframe
          src={src}
          title={title}
          className={styles.embed}
          allowFullScreen
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          loading="lazy"
        />
      )}
    </div>
  )
}
