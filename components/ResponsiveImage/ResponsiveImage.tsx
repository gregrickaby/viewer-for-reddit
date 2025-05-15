'use client'

import {getCachedUrl} from '@/lib/utils/mediaCache'
import {memo, useCallback, useRef, useState} from 'react'
import classes from './ResponsiveImage.module.css'

interface ResponsiveImageProps {
  src: string
  alt?: string
}

export const ResponsiveImage = memo(
  ({src, alt = ''}: Readonly<ResponsiveImageProps>) => {
    const imgRef = useRef<HTMLImageElement | null>(null)
    const [fitClass, setFitClass] = useState<string>(classes.cover)

    const handleLoad = useCallback(() => {
      const img = imgRef.current
      if (!img) return

      const ratio = img.naturalWidth / img.naturalHeight
      const fit = ratio > 1.2 || ratio < 0.8 ? classes.contain : classes.cover
      setFitClass(fit)
    }, [])

    return (
      <a
        aria-label="view full image"
        href={src}
        rel="noopener noreferrer"
        target="_blank"
      >
        <img
          alt={alt}
          className={`${classes.image} ${fitClass}`}
          loading="lazy"
          onLoad={handleLoad}
          ref={imgRef}
          src={getCachedUrl(src)}
        />
      </a>
    )
  }
)
