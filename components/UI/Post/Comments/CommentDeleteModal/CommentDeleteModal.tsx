import {Button, Group, Modal, Text} from '@mantine/core'

/**
 * Props for CommentDeleteModal component.
 */
interface CommentDeleteModalProps {
  /** Whether modal is open */
  opened: boolean
  /** Handler for confirming deletion */
  onConfirm: () => void
  /** Handler for canceling deletion */
  onCancel: () => void
}

/**
 * Confirmation modal for comment deletion.
 *
 * Features:
 * - Accessible modal dialog
 * - Clear warning message
 * - Confirm/cancel buttons
 * - Prevents accidental clicks outside modal
 * - Keyboard accessible (Esc to close)
 *
 * @param props - Component props
 * @returns JSX.Element rendered modal
 */
export function CommentDeleteModal({
  opened,
  onConfirm,
  onCancel
}: Readonly<CommentDeleteModalProps>) {
  return (
    <Modal
      centered
      closeOnClickOutside={false}
      onClose={onCancel}
      opened={opened}
      title="Delete Comment"
    >
      <Text mb="lg">
        Are you sure you want to delete this comment? This action cannot be
        undone.
      </Text>
      <Group gap="sm" justify="flex-end">
        <Button
          data-umami-event="cancel delete comment"
          onClick={onCancel}
          variant="subtle"
        >
          Cancel
        </Button>
        <Button
          color="red"
          data-umami-event="confirm delete comment"
          onClick={onConfirm}
        >
          Delete
        </Button>
      </Group>
    </Modal>
  )
}
