import {useDeleteCommentMutation} from '@/lib/store/services/commentsApi'
import {useCallback} from 'react'

/**
 * Props for useCommentDelete hook.
 */
export interface UseCommentDeleteProps {
  /**
   * Comment fullname to delete (e.g., t1_abc123).
   */
  commentName: string

  /**
   * Update delete error message.
   */
  setDeleteError: (error: string) => void

  /**
   * Mark comment as deleted.
   */
  setIsDeleted: (deleted: boolean) => void

  /**
   * Close delete confirmation modal.
   */
  closeDeleteModal: () => void

  /**
   * Delete button ref for focus management.
   */
  deleteButtonRef: React.RefObject<HTMLButtonElement | null>
}

/**
 * Return value from useCommentDelete hook.
 */
export interface UseCommentDeleteReturn {
  /**
   * Confirm and execute comment deletion.
   */
  handleDeleteConfirm: () => Promise<void>

  /**
   * Cancel deletion and close modal.
   */
  handleDeleteCancel: () => void

  /**
   * Whether deletion is in progress.
   */
  isDeleting: boolean
}

/**
 * Manages comment deletion with confirmation modal and error handling.
 *
 * Features:
 * - Comment deletion via API
 * - Local state updates (isDeleted flag)
 * - Error handling with user feedback
 * - Focus management after cancel
 * - Modal state management
 */
export function useCommentDelete({
  commentName,
  setDeleteError,
  setIsDeleted,
  closeDeleteModal,
  deleteButtonRef
}: UseCommentDeleteProps): UseCommentDeleteReturn {
  const [deleteComment, {isLoading: isDeleting}] = useDeleteCommentMutation()

  /**
   * Confirm and execute comment deletion.
   * Updates local state and closes modal on success.
   */
  const handleDeleteConfirm = useCallback(async () => {
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
  }, [
    closeDeleteModal,
    commentName,
    deleteComment,
    setDeleteError,
    setIsDeleted
  ])

  /**
   * Cancel deletion and close modal.
   * Returns focus to delete button.
   */
  const handleDeleteCancel = useCallback(() => {
    closeDeleteModal()
    // Return focus to delete button after cancel
    setTimeout(() => {
      deleteButtonRef.current?.focus()
    }, 0)
  }, [closeDeleteModal, deleteButtonRef])

  return {
    handleDeleteConfirm,
    handleDeleteCancel,
    isDeleting
  }
}
