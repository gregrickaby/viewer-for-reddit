'use client'

import {BaseCommentForm} from '@/components/UI/Post/Comments/BaseCommentForm/BaseCommentForm'
import {useAppSelector} from '@/lib/store/hooks'
import {useSubmitCommentMutation} from '@/lib/store/services/commentsApi'
import {Box, Button} from '@mantine/core'
import {notifications} from '@mantine/notifications'
import {useEffect, useRef, useState} from 'react'
import {BiCheckCircle, BiComment} from 'react-icons/bi'

export interface CommentFormProps {
  /** The Reddit thing ID to reply to (e.g., t3_abc123 for post) */
  thingId: string
  /** Placeholder text for the textarea */
  placeholder?: string
  /** Show the form expanded by default */
  defaultExpanded?: boolean
}

/**
 * CommentForm component
 *
 * Renders a form for submitting top-level comments on a post.
 * Only visible when user is authenticated.
 *
 * Features:
 * - Toggleable form with expand/collapse
 * - Auto-focus textarea on open
 * - Markdown preview support
 * - Keyboard shortcut: Cmd/Ctrl+Enter to submit
 * - Loading states during submission
 * - Error handling with user-friendly messages
 * - Form clears on successful submission
 *
 * @param thingId - The Reddit thing ID to comment on (post ID)
 * @param placeholder - Custom placeholder text
 * @param defaultExpanded - Show form expanded initially
 */
export function CommentForm({
  thingId,
  placeholder = 'What are your thoughts? (markdown supported)',
  defaultExpanded = false
}: Readonly<CommentFormProps>) {
  const {isAuthenticated} = useAppSelector((state) => state.auth)
  const [showForm, setShowForm] = useState(defaultExpanded)
  const [commentText, setCommentText] = useState('')
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [submitComment, {isLoading: isSubmitting}] = useSubmitCommentMutation()
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const toggleButtonRef = useRef<HTMLButtonElement>(null)

  // Auto-focus textarea when form opens
  useEffect(() => {
    if (showForm && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [showForm])

  const toggleForm = () => {
    setShowForm(!showForm)
    setCommentText('')
    setErrorMessage('')
  }

  const handleSubmit = async () => {
    if (!commentText.trim() || !thingId) return

    try {
      setErrorMessage('')
      await submitComment({
        thing_id: thingId,
        text: commentText
      }).unwrap()

      // Show success message
      notifications.show({
        message:
          'Comment posted successfully! It may take a few moments before Reddit shows your comment.',
        color: 'green',
        icon: <BiCheckCircle size={20} />
      })

      // Reset form state
      setCommentText('')
      setShowForm(false)
    } catch (err) {
      // Extract error message from RTK Query error
      if (err && typeof err === 'object' && 'data' in err && err.data) {
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
    setShowForm(false)
    setCommentText('')
    setErrorMessage('')

    // Return focus to toggle button after cancel
    setTimeout(() => {
      toggleButtonRef.current?.focus()
    }, 0)
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <Box mb="md">
      {showForm ? (
        <BaseCommentForm
          cancelEventName="cancel comment"
          error={errorMessage}
          isSubmitting={isSubmitting}
          onChange={setCommentText}
          onCancel={handleCancel}
          onSubmit={handleSubmit}
          placeholder={placeholder}
          submitEventName="submit comment"
          submitLabel="Comment"
          textareaRef={textareaRef}
          value={commentText}
        />
      ) : (
        <Button
          data-umami-event="show comment form"
          fullWidth
          leftSection={<BiComment size={16} />}
          onClick={toggleForm}
          ref={toggleButtonRef}
          size="sm"
          variant="light"
        >
          Add a comment
        </Button>
      )}
    </Box>
  )
}
