'use client'

import {usePathname} from 'next/navigation'
import {useEffect, useRef} from 'react'

const SCROLL_STORAGE_PREFIX = 'scroll-position:'

/**
 * Resets window scroll on pathname change.
 *
 * Behavior:
 * - Normal navigation: scroll to top
 * - Browser back/forward navigation (including swipe-back): restore prior scroll
 *
 * Note: intentionally keyed to pathname only so query-param
 * updates (like tab/sort changes) preserve current scroll position.
 */
export default function RouteScrollReset() {
  const pathname = usePathname()
  const isPopStateNavigation = useRef(false)

  useEffect(() => {
    const handlePopState = () => {
      isPopStateNavigation.current = true
    }

    globalThis.addEventListener('popstate', handlePopState)

    return () => {
      globalThis.removeEventListener('popstate', handlePopState)
    }
  }, [])

  useEffect(() => {
    const storageKey = `${SCROLL_STORAGE_PREFIX}${pathname}`

    const persistScrollPosition = () => {
      globalThis.sessionStorage.setItem(storageKey, String(globalThis.scrollY))
    }

    const handleScroll = () => {
      persistScrollPosition()
    }

    globalThis.addEventListener('scroll', handleScroll, {passive: true})

    const savedScrollPosition = globalThis.sessionStorage.getItem(storageKey)

    if (isPopStateNavigation.current && savedScrollPosition !== null) {
      globalThis.scrollTo({
        top: Number(savedScrollPosition),
        left: 0,
        behavior: 'auto'
      })
    } else {
      globalThis.scrollTo({top: 0, left: 0, behavior: 'auto'})
    }

    isPopStateNavigation.current = false

    return () => {
      persistScrollPosition()
      globalThis.removeEventListener('scroll', handleScroll)
    }
  }, [pathname])

  return null
}
