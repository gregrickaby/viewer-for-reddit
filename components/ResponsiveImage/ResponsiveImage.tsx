'use client'

import {getCachedUrl} from '@/lib/utils/mediaCache'
import {useCallback, useRef, useState} from 'react'

interface ResponsiveImageProps {
  alt?: string
  src: string
}

export function ResponsiveImage({
  alt = '',
  src
}: Readonly<ResponsiveImageProps>) {
  const imgRef = useRef<HTMLImageElement | null>(null)
  const [responsiveClass, setResponsiveClass] = useState<'contain' | 'cover'>(
    'cover'
  )

  const handleLoad = useCallback(() => {
    const img = imgRef.current
    if (!img) return

    const ratio = img.naturalWidth / img.naturalHeight
    const fit = ratio > 1.2 || ratio < 0.8 ? 'contain' : 'cover'
    setResponsiveClass(fit)
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
        style={{objectFit: responsiveClass as React.CSSProperties['objectFit']}}
        decoding="async"
        loading="lazy"
        onLoad={handleLoad}
        ref={imgRef}
        src={getCachedUrl(src)}
      />
    </a>
  )
}
