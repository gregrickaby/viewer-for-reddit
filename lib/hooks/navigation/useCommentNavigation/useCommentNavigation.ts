import {useCallback} from 'react'
import {useCommentDOMTracking} from '../useCommentDOMTracking/useCommentDOMTracking'
import {useCommentFocus} from '../useCommentFocus/useCommentFocus'
import {useKeyboardNav} from '../useKeyboardNav/useKeyboardNav'

/**
 * Options for comment navigation hook.
 */
export interface CommentNavigationOptions {
  /**
   * Whether keyboard navigation is enabled.
   */
  enabled?: boolean

  /**
   * Whether to announce navigation to screen readers.
   */
  announceNavigation?: boolean
}

/**
 * Return value from comment navigation hook.
 */
export interface CommentNavigationReturn {
  /**
   * Index of currently focused comment.
   */
  currentFocusIndex: number

  /**
   * Screen reader announcement text.
   */
  announcementText: string

  /**
   * Focus a comment by index.
   */
  handleCommentFocus: (index: number) => void

  /**
   * Clear the announcement text.
   */
  clearAnnouncement: () => void
}

/**
 * Orchestrates comment navigation with keyboard shortcuts, focus management, and DOM tracking.
 *
 * Features:
 * - J/K/U keyboard navigation (next/previous/parent)
 * - Automatic DOM element tracking with MutationObserver
 * - Focus management with accessibility announcements
 * - Wrap-around navigation at boundaries
 * - Parent comment navigation based on depth
 */
export function useCommentNavigation({
  enabled = true,
  announceNavigation = true
}: CommentNavigationOptions = {}): CommentNavigationReturn {
  // Track comment DOM elements
  const {elements, updateElements} = useCommentDOMTracking({enabled})

  // Manage focus state and announcements
  const {
    currentFocusIndex,
    announcementText,
    handleCommentFocus,
    clearAnnouncement
  } = useCommentFocus({elements, announceNavigation})

  /**
   * Navigate to next comment (J key).
   * Wraps around to first comment at end.
   */
  const focusNextComment = useCallback(() => {
    updateElements()
    if (elements.length === 0) {
      return
    }

    const nextIndex =
      currentFocusIndex < elements.length - 1 ? currentFocusIndex + 1 : 0
    handleCommentFocus(nextIndex)
  }, [currentFocusIndex, elements.length, handleCommentFocus, updateElements])

  /**
   * Navigate to previous comment (K key).
   * Wraps around to last comment at start.
   */
  const focusPreviousComment = useCallback(() => {
    updateElements()
    if (elements.length === 0) {
      return
    }

    const prevIndex =
      currentFocusIndex > 0 ? currentFocusIndex - 1 : elements.length - 1
    handleCommentFocus(prevIndex)
  }, [currentFocusIndex, elements.length, handleCommentFocus, updateElements])

  /**
   * Navigate to parent comment (U key).
   * Finds first comment above with depth < current depth.
   */
  const focusParentComment = useCallback(() => {
    updateElements()

    if (currentFocusIndex < 0 || currentFocusIndex >= elements.length) {
      return
    }

    const currentElement = elements[currentFocusIndex]
    if (!currentElement) {
      return
    }

    const currentDepth = Number.parseInt(
      currentElement.dataset.commentDepth || '0',
      10
    )

    if (currentDepth === 0) {
      // Already at top level
      return
    }

    // Find the first comment above with depth < current depth
    for (let i = currentFocusIndex - 1; i >= 0; i--) {
      const element = elements[i]
      if (!element) {
        continue
      }

      const depth = Number.parseInt(element.dataset.commentDepth || '0', 10)

      if (depth < currentDepth) {
        handleCommentFocus(i)
        return
      }
    }
  }, [currentFocusIndex, elements, handleCommentFocus, updateElements])

  // Register keyboard shortcuts
  useKeyboardNav({
    enabled,
    onNext: focusNextComment,
    onPrevious: focusPreviousComment,
    onParent: focusParentComment
  })

  return {
    currentFocusIndex,
    announcementText,
    handleCommentFocus,
    clearAnnouncement
  }
}
