import {Text} from '@mantine/core'

/**
 * Renders an empty state message when no comments are available.
 *
 * Displays a user-friendly message encouraging users to be the first
 * to comment on a post. Uses accessible output and aria-describedby
 * for screen reader support.
 *
 * @returns JSX.Element empty state message
 */
export function CommentsEmpty() {
  return (
    <output
      aria-label="No comments available"
      aria-describedby="empty-description"
    >
      <Text size="sm" c="dimmed" id="empty-description">
        No comments to display. Be the first to comment on Reddit!
      </Text>
    </output>
  )
}
