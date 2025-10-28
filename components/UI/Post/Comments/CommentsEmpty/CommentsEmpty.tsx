import {Text} from '@mantine/core'

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
