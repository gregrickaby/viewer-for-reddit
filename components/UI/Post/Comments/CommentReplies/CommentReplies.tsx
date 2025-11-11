import {CommentItem} from '@/components/UI/Post/Comments/CommentItem/CommentItem'
import type {NestedCommentData} from '@/lib/utils/formatting/comments/commentFilters'
import {Box, Stack, Text} from '@mantine/core'

/**
 * Props for CommentReplies component.
 */
interface CommentRepliesProps {
  /** Parent comment data containing replies */
  comment: NestedCommentData
  /** Maximum depth for nested threads */
  maxDepth: number
}

/**
 * Renders nested comment replies (always expanded).
 *
 * Features:
 * - Recursive rendering of nested comments
 * - Depth limit message when max depth reached
 *
 * @param props - Component props
 * @returns JSX.Element rendered replies or null if no replies
 */
export function CommentReplies({
  comment,
  maxDepth
}: Readonly<CommentRepliesProps>) {
  const hasReplies = comment.replies && comment.replies.length > 0

  if (!hasReplies || !comment.replies) {
    return null
  }

  const replies = comment.replies

  // Depth limit reached - show message
  if ((comment.depth ?? 0) >= maxDepth) {
    return (
      <Box ml="md" mt="sm">
        <Text c="dimmed" fs="italic" size="sm">
          {replies.length} more {replies.length === 1 ? 'reply' : 'replies'}{' '}
          (depth limit reached)
        </Text>
      </Box>
    )
  }

  // Render nested replies (always expanded)
  return (
    <Stack gap="sm" mt="sm">
      {replies.map((reply) => (
        <CommentItem
          comment={reply}
          key={reply.id || reply.permalink}
          maxDepth={maxDepth}
        />
      ))}
    </Stack>
  )
}
