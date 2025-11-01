import {useCommentDelete} from '../useCommentDelete/useCommentDelete'
import {useCommentReply} from '../useCommentReply/useCommentReply'

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
 * Orchestrates comment reply and deletion functionality.
 *
 * Composes useCommentReply and useCommentDelete hooks to provide a unified
 * interface for comment actions. Maintains backward compatibility with
 * existing components.
 *
 * @param props - Comment action props
 * @returns Combined reply and delete actions
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
  // Compose reply functionality
  const reply = useCommentReply({
    commentName,
    replyText,
    setReplyText,
    setErrorMessage,
    setShowReplyForm,
    replyButtonRef
  })

  // Compose delete functionality
  const deletion = useCommentDelete({
    commentName,
    setDeleteError,
    setIsDeleted,
    closeDeleteModal,
    deleteButtonRef
  })

  return {
    // Actions
    toggleReplyForm: reply.toggleReplyForm,
    handleSubmit: reply.handleSubmit,
    handleCancel: reply.handleCancel,
    handleDeleteConfirm: deletion.handleDeleteConfirm,
    handleDeleteCancel: deletion.handleDeleteCancel,
    // States
    isSubmitting: reply.isSubmitting,
    isDeleting: deletion.isDeleting
  }
}
