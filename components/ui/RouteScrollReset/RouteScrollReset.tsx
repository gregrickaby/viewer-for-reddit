'use client'

import {usePathname} from 'next/navigation'
import {useEffect, useRef} from 'react'

const SCROLL_STORAGE_PREFIX = 'scroll-position:'

// Next can still reset scroll after a history-traversal's dynamic content
// finishes streaming in (its scroll handler re-checks intent on every
// commit). Keep reasserting the restored position until mutations quiet
// down, capped so a chatty page can't postpone this indefinitely.
const MUTATION_QUIET_MS = 150
const MAX_SETTLE_WAIT_MS = 2000

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

    let settleObserver: MutationObserver | null = null
    let quietTimer: ReturnType<typeof setTimeout> | null = null
    let maxWaitTimer: ReturnType<typeof setTimeout> | null = null

    const stopSettling = () => {
      settleObserver?.disconnect()
      if (quietTimer !== null) clearTimeout(quietTimer)
      if (maxWaitTimer !== null) clearTimeout(maxWaitTimer)
    }

    if (isPopStateNavigation.current && savedScrollPosition !== null) {
      const target = Number(savedScrollPosition)

      const restore = () => {
        globalThis.scrollTo({top: target, left: 0, behavior: 'auto'})
        stopSettling()
      }

      restore()

      const scheduleQuietRestore = () => {
        if (quietTimer !== null) clearTimeout(quietTimer)
        quietTimer = setTimeout(restore, MUTATION_QUIET_MS)
      }

      settleObserver = new MutationObserver(scheduleQuietRestore)
      settleObserver.observe(document.body, {childList: true, subtree: true})
      scheduleQuietRestore()
      maxWaitTimer = setTimeout(restore, MAX_SETTLE_WAIT_MS)
    } else {
      globalThis.scrollTo({top: 0, left: 0, behavior: 'auto'})
    }

    isPopStateNavigation.current = false

    return () => {
      globalThis.removeEventListener('scroll', handleScroll)
      stopSettling()
    }
  }, [pathname])

  return null
}
