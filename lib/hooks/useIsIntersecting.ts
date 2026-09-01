'use client'

import {useEffect, useRef, useState} from 'react'

const THRESHOLD = 0.25

/**
 * Shared across all instances so scrolling a feed doesn't create one
 * IntersectionObserver per rendered embed.
 */
let observer: IntersectionObserver | null = null
const callbacks = new Map<Element, (isIntersecting: boolean) => void>()

function getObserver(): IntersectionObserver {
  observer ??= new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        callbacks.get(entry.target)?.(entry.isIntersecting)
      })
    },
    {threshold: THRESHOLD}
  )
  return observer
}

/**
 * Tracks whether an element is in the viewport (25% threshold). Intended for
 * embeds whose playback can't be controlled directly (e.g. cross-origin
 * iframes) - consumers unmount the embed on scroll-away instead of pausing
 * it, since there's no pause API to call.
 *
 * @returns Ref to attach to the tracked element, and its current visibility
 */
export function useIsIntersecting<T extends Element>(): [
  React.RefObject<T | null>,
  boolean
] {
  const ref = useRef<T>(null)
  const [isIntersecting, setIsIntersecting] = useState(true)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    callbacks.set(element, setIsIntersecting)
    getObserver().observe(element)

    return () => {
      callbacks.delete(element)
      observer?.unobserve(element)
      if (callbacks.size === 0) {
        observer?.disconnect()
        observer = null
      }
    }
  }, [])

  return [ref, isIntersecting]
}
