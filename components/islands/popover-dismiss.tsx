'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

/**
 * Closes open popovers (the account menu, the mobile nav drawer) after a
 * client navigation. They live in the persistent layout, so without this they
 * would stay open over the new page (design §8.6, "Activity-aware islands").
 * Renders nothing.
 */
export function PopoverDismiss() {
  const pathname = usePathname()

  useEffect(() => {
    for (const popover of document.querySelectorAll<HTMLElement>('[popover]:popover-open')) {
      popover.hidePopover()
    }
  }, [pathname])

  return null
}
