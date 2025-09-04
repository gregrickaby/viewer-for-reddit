'use client'

import {getCachedUrl} from '@/lib/utils/mediaCache'
import {useInViewport} from '@mantine/hooks'
import {useCallback, useRef, useState} from 'react'

interface ResponsiveImageProps {
  alt?: string
  src: string | null | undefined
}

export function ResponsiveImage({
  alt = '',
  src
}: Readonly<ResponsiveImageProps>) {
  const {ref, inViewport} = useInViewport()
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
      href={src ?? ''}
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
        src={getCachedUrl(src ?? '')}
      />
    </a>
  )
}
