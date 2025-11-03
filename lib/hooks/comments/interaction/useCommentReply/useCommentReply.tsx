import {useSubmitCommentMutation} from '@/lib/store/services/commentsApi'
import {notifications} from '@mantine/notifications'
import {useCallback} from 'react'
import {BiCheckCircle} from 'react-icons/bi'

/**
 * Props for useCommentReply hook.
 */
export interface UseCommentReplyProps {
  /**
   * Comment fullname to reply to (e.g., t1_abc123).
   */
  commentName: string

  /**
   * Current reply text.
   */
  replyText: string

  /**
   * Update reply text.
   */
  setReplyText: (text: string) => void

  /**
   * Update error message.
   */
  setErrorMessage: (message: string) => void

  /**
   * Update reply form visibility.
   */
  setShowReplyForm: (show: boolean | ((prev: boolean) => boolean)) => void

  /**
   * Reply button ref for focus management.
   */
  replyButtonRef: React.RefObject<HTMLButtonElement | null>
}

/**
 * Return value from useCommentReply hook.
 */
export interface UseCommentReplyReturn {
  /**
   * Toggle reply form visibility.
   */
  toggleReplyForm: () => void

  /**
   * Submit reply comment.
   */
  handleSubmit: () => Promise<void>

  /**
   * Cancel reply and clear form.
   */
  handleCancel: () => void

  /**
   * Whether submission is in progress.
   */
  isSubmitting: boolean
}

/**
 * Manages comment reply functionality with form state and submission.
 *
 * Features:
 * - Reply form toggle with text clearing
 * - Comment submission with validation
 * - Success notifications via Mantine
 * - Error handling with user feedback
 * - Focus management after cancel
 */
export function useCommentReply({
  commentName,
  replyText,
  setReplyText,
  setErrorMessage,
  setShowReplyForm,
  replyButtonRef
}: UseCommentReplyProps): UseCommentReplyReturn {
  const [submitComment, {isLoading: isSubmitting}] = useSubmitCommentMutation()

  /**
   * Toggle reply form visibility.
   * Clears text when closing form.
   */
  const toggleReplyForm = useCallback(() => {
    setShowReplyForm((prev: boolean) => {
      if (prev) {
        setReplyText('')
      }
      return !prev
    })
  }, [setReplyText, setShowReplyForm])

  /**
   * Submit reply comment.
   * Shows success notification and closes form on success.
   */
  const handleSubmit = useCallback(async () => {
    if (!replyText.trim() || !commentName) return

    try {
      setErrorMessage('')
      await submitComment({
        thing_id: commentName,
        text: replyText
      }).unwrap()

      // Show success message
      notifications.show({
        message:
          'Comment posted successfully! It may take a few moments before Reddit shows your comment.',
        color: 'green',
        icon: <BiCheckCircle size={20} />
      })

      // Success: close form and clear text
      setShowReplyForm(false)
      setReplyText('')
    } catch (err) {
      // Extract error message from RTK Query error
      if (err && typeof err === 'object' && 'data' in err) {
        const errorData = err.data as {message?: string; error?: string}
        setErrorMessage(
          errorData.message ||
            errorData.error ||
            'Failed to submit comment. Please try again.'
        )
      } else {
        setErrorMessage('Failed to submit comment. Please try again.')
      }
    }
  }, [
    commentName,
    replyText,
    setErrorMessage,
    setReplyText,
    setShowReplyForm,
    submitComment
  ])

  /**
   * Cancel reply and clear form.
   * Returns focus to reply button.
   */
  const handleCancel = useCallback(() => {
    setShowReplyForm(false)
    setReplyText('')
    setErrorMessage('')

    // Return focus to reply button after cancel
    setTimeout(() => {
      replyButtonRef.current?.focus()
    }, 0)
  }, [replyButtonRef, setErrorMessage, setReplyText, setShowReplyForm])

  return {
    toggleReplyForm,
    handleSubmit,
    handleCancel,
    isSubmitting
  }
}
