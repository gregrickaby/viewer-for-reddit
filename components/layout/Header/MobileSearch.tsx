'use client'

import {SearchBar} from '@/components/ui/SearchBar/SearchBar'

/**
 * Mounts the Spotlight search overlay once, regardless of viewport. The
 * wide trigger bar lives in `DesktopSearch` (shown at every breakpoint) and
 * opens this overlay via `spotlight.open()`.
 */
export function MobileSearch() {
  return <SearchBar />
}
