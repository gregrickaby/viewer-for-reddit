import {useEffect, useRef} from 'react'

/**
 * Props for useCommentFocusManagement hook.
 */
interface UseCommentFocusManagementProps {
  /** Whether reply form is shown */
  showReplyForm: boolean
}

/**
 * Hook for managing focus within comment component.
 *
 * Handles:
 * - Auto-focus textarea when reply form opens
 * - Maintain refs for focus return after actions
 * - Accessible focus management patterns
 *
 * @param props - Hook props
 * @returns Refs for focus management
 */
export function useCommentFocusManagement({
  showReplyForm
}: UseCommentFocusManagementProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const replyButtonRef = useRef<HTMLButtonElement>(null)
  const deleteButtonRef = useRef<HTMLButtonElement>(null)

  // Auto-focus textarea when reply form opens
  useEffect(() => {
    if (showReplyForm && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [showReplyForm])

  return {
    textareaRef,
    replyButtonRef,
    deleteButtonRef
  }
}
