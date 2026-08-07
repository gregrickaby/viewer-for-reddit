'use client'

import {SearchBar} from '@/components/ui/SearchBar/SearchBar'
import {ActionIcon} from '@mantine/core'
import {spotlight} from '@mantine/spotlight'
import {IconSearch} from '@tabler/icons-react'

/**
 * Mobile search trigger (icon button), plus the Spotlight overlay itself --
 * mounted once here regardless of viewport. The wide desktop trigger lives
 * in `DesktopSearch` and opens this same overlay via `spotlight.open()`.
 */
export function MobileSearch() {
  return (
    <>
      <ActionIcon
        variant="subtle"
        color="gray"
        size="lg"
        hiddenFrom="sm"
        aria-label="Search"
        onClick={spotlight.open}
      >
        <IconSearch aria-hidden="true" size={20} />
      </ActionIcon>

      {/* Spotlight overlay – mounted once, opened programmatically */}
      <SearchBar />
    </>
  )
}
