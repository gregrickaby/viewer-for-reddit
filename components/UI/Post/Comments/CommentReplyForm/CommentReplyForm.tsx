import {BaseCommentForm} from '@/components/UI/Post/Comments/BaseCommentForm/BaseCommentForm'
import {Collapse} from '@mantine/core'

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
 * - Markdown preview support
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
  isSubmitting,
  errorMessage,
  textareaRef
}: Readonly<CommentReplyFormProps>) {
  return (
    <Collapse in={showReplyForm}>
      <BaseCommentForm
        buttonSize="xs"
        cancelEventName="cancel reply comment"
        error={errorMessage}
        isSubmitting={isSubmitting}
        minRows={3}
        onChange={onReplyTextChange}
        onCancel={onCancel}
        onSubmit={onSubmit}
        placeholder="Write your reply (markdown supported)..."
        submitEventName="submit reply comment"
        submitLabel="Submit"
        textareaRef={textareaRef}
        value={replyText}
      />
    </Collapse>
  )
}
