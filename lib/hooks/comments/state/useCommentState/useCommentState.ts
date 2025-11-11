import {useAppSelector} from '@/lib/store/hooks'
import {useDisclosure} from '@mantine/hooks'
import {useState} from 'react'

/**
 * Hook for managing comment component state.
 *
 * Encapsulates all stateful logic:
 * - Reply form state (visibility, text, errors)
 * - Delete state (modal, errors, local deletion flag)
 * - Authentication state (is authenticated, username)
 *
 * @returns All state values and setters
 */
export function useCommentState() {
  // Reply form state
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [errorMessage, setErrorMessage] = useState<string>('')

  // Delete state
  const [deleteError, setDeleteError] = useState<string>('')
  const [isDeleted, setIsDeleted] = useState(false)
  const [deleteModalOpened, {open: openDeleteModal, close: closeDeleteModal}] =
    useDisclosure(false)

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
    // Authentication state
    isAuthenticated,
    currentUsername
  }
}
