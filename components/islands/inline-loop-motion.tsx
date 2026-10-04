'use client'

import { useEffect, useRef } from 'react'
import { registerPlayer } from './player-registry'
import { useReducedMotion } from './use-reduced-motion'

/** Each inline loop's server-rendered source, kept while it is unloaded. */
const sources = new WeakMap<HTMLVideoElement, string>()

/**
 * Pins a loop's box to the video's own size once known. Unloaded, a video falls back
 * to its attributes or 300×150, and a box that changes size above the viewport makes
 * Safari, which has no scroll anchoring, jump the page.
 */
function pinSize(video: HTMLVideoElement): boolean {
  if (!video.videoWidth || !video.videoHeight) return false
  video.style.inlineSize = `${video.videoWidth}px`
  video.style.aspectRatio = `${video.videoWidth} / ${video.videoHeight}`
  return true
}

/**
 * Inline GIF loops in Reddit HTML are plain `<video autoplay>` markup, so they
 * animate without JavaScript. Once hydrated, this hands the loops in the block
 * just before it to the player registry, like `AutoplayVideo`: each plays while
 * visible and unloads once it is far away, so a thread full of GIFs doesn't hold
 * a decoder for every one. A loop unloads only once its size is pinned, so its box
 * never changes. Under reduced motion they wait for their controls instead
 * (design §8.7). Renders an empty, hidden marker.
 */
export function InlineLoopMotion() {
  const markerRef = useRef<HTMLSpanElement>(null)
  const reduced = useReducedMotion()

  useEffect(() => {
    const block = markerRef.current?.previousElementSibling
    if (!block) return
    const cleanups = [...block.querySelectorAll('video')].map((video) => {
      const loaded = video.getAttribute('src')
      if (loaded && !sources.has(video)) sources.set(video, loaded)
      const src = sources.get(video)
      if (!pinSize(video)) {
        video.addEventListener('loadedmetadata', () => pinSize(video), { once: true })
      }
      if (reduced) {
        // Pausing also stops `autoplay` from starting it once it has loaded.
        video.autoplay = false
        video.pause()
        video.controls = true
      }
      return registerPlayer(
        video.parentElement ?? video,
        {
          attach: () => {
            if (src && video.getAttribute('src') !== src) video.src = src
          },
          detach: () => {
            if (!video.style.aspectRatio) return
            video.pause()
            video.removeAttribute('src')
            video.load()
          },
          visibility: (visible) => {
            if (visible && !reduced) void video.play().catch(() => {})
            else video.pause()
          },
        },
        { attached: loaded !== null, release: true },
      )
    })
    return () => {
      for (const cleanup of cleanups) cleanup()
    }
  }, [reduced])

  return <span ref={markerRef} hidden />
}
