'use client'

import {useCombobox} from '@mantine/core'
import {useMediaQuery} from '@mantine/hooks'
import {useEffect, useRef} from 'react'

/** Mantine sm breakpoint for mobile detection */
const MOBILE_BREAKPOINT = '48em'

/**
 * Options for useSearchBar hook.
 */
interface UseSearchBarOptions {
  /** Current search query */
  query: string
  /** Update search query */
  setQuery: (value: string) => void
  /** Whether mobile search overlay is open */
  mobileOpen?: boolean
  /** Handle selecting a subreddit from dropdown */
  handleOptionSelect: (value: string) => void
  /** Handle form submission (Enter key) */
  handleSubmit: () => void
  /** Callback to close mobile search overlay */
  onMobileClose?: () => void
}

/**
 * Return type for useSearchBar hook.
 */
export interface UseSearchBarReturn {
  /** Input element ref */
  inputRef: React.RefObject<HTMLInputElement | null>
  /** Combobox instance */
  combobox: ReturnType<typeof useCombobox>
  /** Whether viewport is mobile */
  isMobile: boolean
  /** Handle selecting an option */
  handleSelect: (value: string) => void
  /** Handle input keyboard events */
  handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void
}

/**
 * Hook for SearchBar component logic.
 * Handles keyboard shortcuts, focus management, and event handlers.
 *
 * Features:
 * - Global '/' keyboard shortcut to focus search
 * - Auto-focus when mobile modal opens
 * - Escape key to clear or close
 * - Enter key to submit search
 * - Mobile/desktop detection
 *
 * @param options - Configuration options
 * @returns Search bar state and handlers
 *
 * @example
 * ```typescript
 * const {
 *   inputRef,
 *   combobox,
 *   isMobile,
 *   handleSelect,
 *   handleKeyDown
 * } = useSearchBar({
 *   query,
 *   setQuery,
 *   handleOptionSelect,
 *   handleSubmit
 * })
 * ```
 */
export function useSearchBar({
  query,
  setQuery,
  mobileOpen = false,
  handleOptionSelect,
  handleSubmit,
  onMobileClose
}: UseSearchBarOptions): UseSearchBarReturn {
  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption()
  })
  const inputRef = useRef<HTMLInputElement>(null)
  const isMobile = useMediaQuery(`(max-width: ${MOBILE_BREAKPOINT})`)

  // Global keyboard shortcut: Press '/' to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === '/' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault()
        inputRef.current?.focus()
        combobox.openDropdown()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [combobox])

  // Auto-focus input when mobile search opens
  useEffect(() => {
    if (mobileOpen && inputRef.current) {
      // Delay focus to allow modal animation to complete
      const timeoutId = setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
      return () => clearTimeout(timeoutId)
    }
  }, [mobileOpen])

  const handleSelect = (value: string) => {
    handleOptionSelect(value)
    combobox.closeDropdown()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      if (query) {
        setQuery('')
        combobox.closeDropdown()
      } else if (isMobile && onMobileClose) {
        onMobileClose()
      }
    }

    if (e.key === 'Enter' && query.trim()) {
      e.preventDefault()
      handleSubmit()
      combobox.closeDropdown()
      if (isMobile && onMobileClose) {
        onMobileClose()
      }
    }
  }

  return {
    inputRef,
    combobox,
    isMobile,
    handleSelect,
    handleKeyDown
  }
}
