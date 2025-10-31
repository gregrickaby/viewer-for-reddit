import {
  useDeleteCommentMutation,
  useSubmitCommentMutation
} from '@/lib/store/services/commentsApi'
import {notifications} from '@mantine/notifications'
import {BiCheckCircle} from 'react-icons/bi'

/**
 * Props for useCommentActions hook.
 */
interface UseCommentActionsProps {
  /** Comment fullname (e.g., t1_abc123) */
  commentName: string
  /** Reply text state */
  replyText: string
  /** Set reply text */
  setReplyText: (text: string) => void
  /** Set error message */
  setErrorMessage: (message: string) => void
  /** Set show reply form */
  setShowReplyForm: (show: boolean | ((prev: boolean) => boolean)) => void
  /** Set delete error */
  setDeleteError: (error: string) => void
  /** Set is deleted */
  setIsDeleted: (deleted: boolean) => void
  /** Close delete modal */
  closeDeleteModal: () => void
  /** Reply button ref for focus management */
  replyButtonRef: React.RefObject<HTMLButtonElement | null>
  /** Delete button ref for focus management */
  deleteButtonRef: React.RefObject<HTMLButtonElement | null>
}

/**
 * Hook for managing comment actions (reply, delete).
 *
 * Encapsulates business logic for:
 * - Submitting replies with success notifications
 * - Deleting comments with confirmation
 * - Error handling and user feedback
 * - Focus management after actions
 *
 * @param props - Hook props
 * @returns Action handlers and mutation states
 */
export function useCommentActions({
  commentName,
  replyText,
  setReplyText,
  setErrorMessage,
  setShowReplyForm,
  setDeleteError,
  setIsDeleted,
  closeDeleteModal,
  replyButtonRef,
  deleteButtonRef
}: UseCommentActionsProps) {
  const [submitComment, {isLoading: isSubmitting}] = useSubmitCommentMutation()
  const [deleteComment, {isLoading: isDeleting}] = useDeleteCommentMutation()

  const toggleReplyForm = () => {
    setShowReplyForm((prev: boolean) => {
      if (prev) {
        setReplyText('')
      }
      return !prev
    })
  }

  const handleSubmit = async () => {
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
  }

  const handleCancel = () => {
    setShowReplyForm(false)
    setReplyText('')
    setErrorMessage('')

    // Return focus to reply button after cancel
    setTimeout(() => {
      replyButtonRef.current?.focus()
    }, 0)
  }

  const handleDeleteConfirm = async () => {
    if (!commentName) return

    try {
      setDeleteError('')
      await deleteComment({id: commentName}).unwrap()

      // Mark as deleted locally
      setIsDeleted(true)

      // Close modal after successful deletion
      closeDeleteModal()
    } catch (err) {
      // Extract error message from RTK Query error
      if (err && typeof err === 'object' && 'data' in err) {
        const errorData = err.data as {message?: string; error?: string}
        setDeleteError(
          errorData.message ||
            errorData.error ||
            'Failed to delete comment. Please try again.'
        )
      } else {
        setDeleteError('Failed to delete comment. Please try again.')
      }

      // Close modal even if deletion fails
      closeDeleteModal()
    }
  }

  const handleDeleteCancel = () => {
    closeDeleteModal()
    // Return focus to delete button after cancel
    setTimeout(() => {
      deleteButtonRef.current?.focus()
    }, 0)
  }

  return {
    // Actions
    toggleReplyForm,
    handleSubmit,
    handleCancel,
    handleDeleteConfirm,
    handleDeleteCancel,
    // States
    isSubmitting,
    isDeleting
  }
}
