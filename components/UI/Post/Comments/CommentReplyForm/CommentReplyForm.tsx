import {Button, Collapse, Group, Stack, Text, Textarea} from '@mantine/core'

/**
 * Props for CommentReplyForm component.
 */
interface CommentReplyFormProps {
  /** Whether reply form is shown */
  showReplyForm: boolean
  /** Reply text */
  replyText: string
  /** Handler for text change */
  onReplyTextChange: (text: string) => void
  /** Handler for form submission */
  onSubmit: () => Promise<void>
  /** Handler for cancel */
  onCancel: () => void
  /** Handler for keyboard events */
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
  /** Whether submission is in progress */
  isSubmitting: boolean
  /** Error message to display */
  errorMessage: string
  /** Ref for textarea auto-focus */
  textareaRef: React.RefObject<HTMLTextAreaElement | null>
}

/**
 * Reply form for commenting on a comment.
 *
 * Features:
 * - Collapsible form with animation
 * - Auto-focus textarea
 * - Keyboard shortcuts (Cmd/Ctrl+Enter to submit)
 * - Submit/cancel buttons
 * - Error message display
 * - Loading states
 *
 * @param props - Component props
 * @returns JSX.Element rendered reply form
 */
export function CommentReplyForm({
  showReplyForm,
  replyText,
  onReplyTextChange,
  onSubmit,
  onCancel,
  onKeyDown,
  isSubmitting,
  errorMessage,
  textareaRef
}: Readonly<CommentReplyFormProps>) {
  return (
    <Collapse in={showReplyForm}>
      <Stack gap="xs" mt="xs">
        <Textarea
          aria-busy={isSubmitting}
          aria-label="Reply text. Press Ctrl+Enter or Cmd+Enter to submit."
          autosize
          disabled={isSubmitting}
          maxLength={10000}
          minRows={3}
          onChange={(e) => onReplyTextChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Write your reply (markdown supported)..."
          ref={textareaRef}
          value={replyText}
        />

        <Group gap="xs">
          <Button
            data-umami-event="submit reply comment"
            disabled={!replyText.trim()}
            loading={isSubmitting}
            onClick={onSubmit}
            size="xs"
          >
            Submit
          </Button>
          <Button
            data-umami-event="cancel reply comment"
            disabled={isSubmitting}
            onClick={onCancel}
            size="xs"
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
    </Collapse>
  )
}
