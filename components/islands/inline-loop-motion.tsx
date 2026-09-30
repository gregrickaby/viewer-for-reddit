'use client'

import { useEffect, useRef } from 'react'
import { useReducedMotion } from './use-reduced-motion'

/**
 * Inline GIF loops in Reddit HTML are plain `<video autoplay>` markup, so they
 * animate without JavaScript. Under reduced motion this pauses the loops in
 * the block just before it and gives them controls: the counterpart of
 * `AutoplayVideo`'s ▶ Play (design §8.7). Renders an empty, hidden marker.
 */
export function InlineLoopMotion() {
  const markerRef = useRef<HTMLSpanElement>(null)
  const reduced = useReducedMotion()

  useEffect(() => {
    const block = markerRef.current?.previousElementSibling
    if (!reduced || !block) return
    for (const video of block.querySelectorAll('video')) {
      // Pausing also stops `autoplay` from starting it once it has loaded.
      video.pause()
      video.controls = true
    }
  }, [reduced])

  return <span ref={markerRef} hidden />
}
