import {useCallback, useState} from 'react'

/**
 * Parameters for useCommentFocus hook.
 */
interface UseCommentFocusParams {
  /** Element list for focus management */
  elements: HTMLElement[]
  /** Whether to announce navigation */
  announceNavigation: boolean
}

/**
 * Return value for useCommentFocus hook.
 */
interface UseCommentFocusReturn {
  /** Current focused comment index */
  currentFocusIndex: number
  /** Announcement text for accessibility */
  announcementText: string
  /** Focus a comment by index */
  handleCommentFocus: (index: number) => void
  /** Clear announcement text */
  clearAnnouncement: () => void
}

/**
 * Manages focus state and accessibility announcements for comment navigation.
 *
 * Features:
 * - Focus index tracking
 * - Accessibility announcements with depth
 * - Bounds checking for safe focusing
 */
export function useCommentFocus({
  elements,
  announceNavigation
}: UseCommentFocusParams): UseCommentFocusReturn {
  const [currentFocusIndex, setCurrentFocusIndex] = useState(-1)
  const [announcementText, setAnnouncementText] = useState('')

  /**
   * Focus a comment by index and announce navigation.
   */
  const handleCommentFocus = useCallback(
    (index: number) => {
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
    [announceNavigation, elements]
  )

  /**
   * Clear announcement text.
   */
  const clearAnnouncement = useCallback(() => {
    setAnnouncementText('')
  }, [])

  return {
    currentFocusIndex,
    announcementText,
    handleCommentFocus,
    clearAnnouncement
  }
}
