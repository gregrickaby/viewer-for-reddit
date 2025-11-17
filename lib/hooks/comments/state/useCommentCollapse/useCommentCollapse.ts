import {useState} from 'react'

/**
 * Hook for managing comment thread collapse state.
 *
 * Provides toggle functionality for collapsing/expanding comment threads
 * to improve readability of deeply nested discussions.
 *
 * @param initialCollapsed - Initial collapse state (default: false)
 * @returns Object containing collapse state and toggle function
 */
export function useCommentCollapse(initialCollapsed = false) {
  const [isCollapsed, setIsCollapsed] = useState(initialCollapsed)

  /**
   * Toggle the collapse state.
   */
  const toggleCollapse = () => {
    setIsCollapsed((prev) => !prev)
  }

  return {
    isCollapsed,
    toggleCollapse
  }
}
