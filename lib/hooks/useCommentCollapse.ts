'use client'

import {useState} from 'react'

/**
 * Hook for managing comment collapse state.
 * Controls whether a comment's body and replies are visible.
 *
 * Features:
 * - Toggle collapse state
 * - Returns current state and toggle function
 *
 * @returns isCollapsed state and toggleCollapse function
 *
 * @example
 * ```typescript
 * const {isCollapsed, toggleCollapse} = useCommentCollapse()
 *
 * <Button onClick={toggleCollapse}>
 *   {isCollapsed ? 'Expand' : 'Collapse'}
 * </Button>
 * <Collapse in={!isCollapsed}>
 *   {comment.body}
 * </Collapse>
 * ```
 */
export function useCommentCollapse() {
  const [isCollapsed, setIsCollapsed] = useState(false)

  const toggleCollapse = () => {
    setIsCollapsed((prev) => !prev)
  }

  return {
    isCollapsed,
    toggleCollapse
  }
}
