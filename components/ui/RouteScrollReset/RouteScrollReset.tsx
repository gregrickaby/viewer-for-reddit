'use client'

import {usePathname} from 'next/navigation'
import {useEffect} from 'react'

/**
 * Resets window scroll to top when pathname changes.
 *
 * Note: intentionally keyed to pathname only so query-param
 * updates (like tab/sort changes) preserve current scroll position.
 */
export default function RouteScrollReset() {
  const pathname = usePathname()

  useEffect(() => {
    globalThis.scrollTo({top: 0, left: 0, behavior: 'auto'})
  }, [pathname])

  return null
}
