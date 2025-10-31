import {useHotkeys} from '@mantine/hooks'
import {useCallback, useEffect, useRef, useState} from 'react'

interface CommentNavigationOptions {
  enabled?: boolean
  announceNavigation?: boolean
}

interface CommentNavigationReturn {
  currentFocusIndex: number
  announcementText: string
  handleCommentFocus: (index: number) => void
  clearAnnouncement: () => void
}

/**
 * Hook for J/K/U keyboard navigation in comment threads.
 * Provides Reddit Enhancement Suite (RES)-style navigation.
 */
export function useCommentNavigation({
  enabled = true,
  announceNavigation = true
}: CommentNavigationOptions = {}): CommentNavigationReturn {
  const [currentFocusIndex, setCurrentFocusIndex] = useState(-1)
  const [announcementText, setAnnouncementText] = useState('')
  const commentElementsRef = useRef<HTMLElement[]>([])

  /**
   * Update the list of focusable comment elements.
   */
  const updateCommentElements = useCallback(() => {
    const elements = Array.from(
      document.querySelectorAll<HTMLElement>('[data-comment-id]')
    )
    commentElementsRef.current = elements
  }, [])

  /**
   * Focus a comment by index and announce navigation.
   */
  const focusCommentAtIndex = useCallback(
    (index: number) => {
      const elements = commentElementsRef.current
      if (index < 0 || index >= elements.length) {
        return
      }

      const element = elements[index]
      if (!element) {
        return
      }

      element.focus()
      setCurrentFocusIndex(index)

      if (announceNavigation) {
        const depth = element.dataset.commentDepth
        setAnnouncementText(
          `Comment ${index + 1} of ${elements.length}, depth ${depth || 0}`
        )
      }
    },
    [announceNavigation]
  )

  /**
   * Navigate to next comment (J key).
   */
  const focusNextComment = useCallback(() => {
    updateCommentElements()
    const elements = commentElementsRef.current
    if (elements.length === 0) {
      return
    }

    const nextIndex =
      currentFocusIndex < elements.length - 1 ? currentFocusIndex + 1 : 0
    focusCommentAtIndex(nextIndex)
  }, [currentFocusIndex, focusCommentAtIndex, updateCommentElements])

  /**
   * Navigate to previous comment (K key).
   */
  const focusPreviousComment = useCallback(() => {
    updateCommentElements()
    const elements = commentElementsRef.current
    if (elements.length === 0) {
      return
    }

    const prevIndex =
      currentFocusIndex > 0 ? currentFocusIndex - 1 : elements.length - 1
    focusCommentAtIndex(prevIndex)
  }, [currentFocusIndex, focusCommentAtIndex, updateCommentElements])

  /**
   * Navigate to parent comment (U key).
   */
  const focusParentComment = useCallback(() => {
    updateCommentElements()
    const elements = commentElementsRef.current
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
        focusCommentAtIndex(i)
        return
      }
    }
  }, [currentFocusIndex, focusCommentAtIndex, updateCommentElements])

  /**
   * Register keyboard shortcuts using Mantine's useHotkeys.
   */
  useHotkeys(
    enabled
      ? [
          ['j', focusNextComment],
          ['k', focusPreviousComment],
          ['u', focusParentComment]
        ]
      : [],
    ['INPUT', 'TEXTAREA']
  )

  /**
   * Update comment elements when DOM changes.
   */
  useEffect(() => {
    if (!enabled) {
      return
    }

    updateCommentElements()

    // Use MutationObserver to track DOM changes
    const observer = new MutationObserver(() => {
      updateCommentElements()
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true
    })

    return () => {
      observer.disconnect()
    }
  }, [enabled, updateCommentElements])

  return {
    currentFocusIndex,
    announcementText,
    handleCommentFocus: focusCommentAtIndex,
    clearAnnouncement: () => setAnnouncementText('')
  }
}
