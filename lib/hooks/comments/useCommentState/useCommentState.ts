import {
  selectIsCommentExpanded,
  selectIsSubtreeExpanded
} from '@/lib/store/features/commentExpansionSlice'
import {useAppSelector} from '@/lib/store/hooks'
import {useDisclosure} from '@mantine/hooks'
import {useState} from 'react'

/**
 * Props for useCommentState hook.
 */
interface UseCommentStateProps {
  /** Comment ID for expansion state */
  commentId: string
  /** Comment depth for default expansion */
  commentDepth: number
}

/**
 * Hook for managing comment component state.
 *
 * Encapsulates all stateful logic:
 * - Reply form state (visibility, text, errors)
 * - Delete state (modal, errors, local deletion flag)
 * - Expansion state (comment and subtree from Redux)
 * - Authentication state (is authenticated, username)
 *
 * @param props - Hook props
 * @returns All state values and setters
 */
export function useCommentState({
  commentId,
  commentDepth
}: UseCommentStateProps) {
  // Reply form state
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [errorMessage, setErrorMessage] = useState<string>('')

  // Delete state
  const [deleteError, setDeleteError] = useState<string>('')
  const [isDeleted, setIsDeleted] = useState(false)
  const [deleteModalOpened, {open: openDeleteModal, close: closeDeleteModal}] =
    useDisclosure(false)

  // Expansion state (from Redux)
  const isExpanded = useAppSelector((state) =>
    selectIsCommentExpanded(state, commentId, commentDepth)
  )
  const isSubtreeFullyExpanded = useAppSelector((state) =>
    selectIsSubtreeExpanded(state, commentId)
  )

  // Authentication state (from Redux)
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated)
  const currentUsername = useAppSelector((state) => state.auth.username)

  return {
    // Reply form state
    showReplyForm,
    setShowReplyForm,
    replyText,
    setReplyText,
    errorMessage,
    setErrorMessage,
    // Delete state
    deleteError,
    setDeleteError,
    isDeleted,
    setIsDeleted,
    deleteModalOpened,
    openDeleteModal,
    closeDeleteModal,
    // Expansion state
    isExpanded,
    isSubtreeFullyExpanded,
    // Authentication state
    isAuthenticated,
    currentUsername
  }
}
