import {useCallback, useEffect, useState} from 'react'

/**
 * Parameters for useCommentDOMTracking hook.
 */
interface UseCommentDOMTrackingParams {
  /** Enable DOM tracking */
  enabled: boolean
}

/**
 * Return value for useCommentDOMTracking hook.
 */
interface UseCommentDOMTrackingReturn {
  /** Current comment elements */
  elements: HTMLElement[]
  /** Update element list */
  updateElements: () => void
}

/**
 * Manages DOM element tracking for comment navigation.
 *
 * Features:
 * - Queries [data-comment-id] elements
 * - MutationObserver for dynamic content
 * - Automatic cleanup on unmount
 */
export function useCommentDOMTracking({
  enabled
}: UseCommentDOMTrackingParams): UseCommentDOMTrackingReturn {
  const [elements, setElements] = useState<HTMLElement[]>([])

  /**
   * Update the list of focusable comment elements.
   */
  const updateElements = useCallback(() => {
    if (!enabled) {
      setElements([])
      return
    }

    const newElements = Array.from(
      document.querySelectorAll<HTMLElement>('[data-comment-id]')
    )
    setElements(newElements)
  }, [enabled])

  /**
   * Set up MutationObserver to track DOM changes.
   */
  useEffect(() => {
    if (!enabled) {
      return
    }

    // Initial update
    updateElements()

    // Watch for DOM changes
    const observer = new MutationObserver(() => {
      updateElements()
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true
    })

    return () => {
      observer.disconnect()
    }
  }, [enabled, updateElements])

  return {
    elements,
    updateElements
  }
}
