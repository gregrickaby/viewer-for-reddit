'use client'

import {usePathname} from 'next/navigation'
import {useEffect, useRef} from 'react'

const SCROLL_STORAGE_PREFIX = 'scroll-position:'

/**
 * Resets window scroll on pathname change. Restores the prior scroll position
 * when navigating with the browser's back or forward buttons.
 */
export default function RouteScrollReset() {
  const pathname = usePathname()
  const isPopStateNavigation = useRef(false)

  useEffect(() => {
    // The browser's own automatic scroll restoration races with the manual
    // restore below (most visible on iOS Safari, where it can snap back to 0
    // after this component's scrollTo runs). Take restoration over fully.
    if ('scrollRestoration' in globalThis.history) {
      globalThis.history.scrollRestoration = 'manual'
    }

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

    const handleScroll = () => {
      globalThis.sessionStorage.setItem(storageKey, String(globalThis.scrollY))
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
      globalThis.removeEventListener('scroll', handleScroll)
    }
  }, [pathname])

  return null
}
