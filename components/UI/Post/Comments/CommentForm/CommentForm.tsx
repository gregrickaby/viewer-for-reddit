'use client'

import {useAppSelector} from '@/lib/store/hooks'
import {useSubmitCommentMutation} from '@/lib/store/services/commentSubmitApi'
import {Box, Button, Group, Stack, Text, Textarea} from '@mantine/core'
import {useEffect, useRef, useState} from 'react'
import {BiComment} from 'react-icons/bi'

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
 * - Auto-focus textarea on open
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
  placeholder = 'What are your thoughts?',
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

      // Success: close form and clear text
      setShowForm(false)
      setCommentText('')
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Cmd+Enter (Mac) or Ctrl+Enter (Windows/Linux)
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      handleSubmit()
    }
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <Box mb="md">
      {showForm ? (
        <Stack gap="xs">
          <Textarea
            ref={textareaRef}
            aria-label="Comment text. Press Ctrl+Enter or Cmd+Enter to submit."
            aria-busy={isSubmitting}
            autosize
            disabled={isSubmitting}
            maxLength={10000}
            minRows={4}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            value={commentText}
          />

          <Group gap="xs">
            <Button
              disabled={!commentText.trim()}
              loading={isSubmitting}
              onClick={handleSubmit}
              size="sm"
            >
              Comment
            </Button>
            <Button
              disabled={isSubmitting}
              onClick={handleCancel}
              size="sm"
              variant="subtle"
            >
              Cancel
            </Button>
          </Group>

          {errorMessage && (
            <Text c="red" size="sm" role="alert">
              {errorMessage}
            </Text>
          )}
        </Stack>
      ) : (
        <Button
          ref={toggleButtonRef}
          variant="light"
          size="sm"
          onClick={toggleForm}
          leftSection={<BiComment size={16} />}
          fullWidth
        >
          Add a comment
        </Button>
      )}
    </Box>
  )
}
