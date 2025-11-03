import {useHotkeys} from '@mantine/hooks'

/**
 * Parameters for useKeyboardNav hook.
 */
interface UseKeyboardNavParams {
  /** Enable keyboard navigation */
  enabled: boolean
  /** Navigate to next comment */
  onNext: () => void
  /** Navigate to previous comment */
  onPrevious: () => void
  /** Navigate to parent comment */
  onParent: () => void
}

/**
 * Manages keyboard shortcuts for comment navigation.
 *
 * Keyboard Shortcuts:
 * - J: Next comment
 * - K: Previous comment
 * - U: Parent comment
 *
 * Features:
 * - Reddit Enhancement Suite (RES) style navigation
 * - Disabled when typing in INPUT/TEXTAREA
 * - Can be enabled/disabled dynamically
 *
 * @param params - Navigation callbacks and enabled state
 */
export function useKeyboardNav({
  enabled,
  onNext,
  onPrevious,
  onParent
}: UseKeyboardNavParams): void {
  useHotkeys(
    enabled
      ? [
          ['j', onNext],
          ['k', onPrevious],
          ['u', onParent]
        ]
      : [],
    ['INPUT', 'TEXTAREA']
  )
}
