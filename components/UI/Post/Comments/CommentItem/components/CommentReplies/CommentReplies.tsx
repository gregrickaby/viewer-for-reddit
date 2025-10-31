import type {NestedCommentData} from '@/lib/utils/formatting/commentFilters'
import {decodeAndSanitizeHtml} from '@/lib/utils/validation/sanitizeText'
import {Box, Collapse, Stack, Text} from '@mantine/core'
import {CommentItem} from '../../CommentItem'
import classes from '../../CommentItem.module.css'

/**
 * Props for CommentReplies component.
 */
interface CommentRepliesProps {
  /** Parent comment data containing replies */
  comment: NestedCommentData
  /** Whether replies section is expanded */
  isExpanded: boolean
  /** Maximum depth for nested threads */
  maxDepth: number
}

/**
 * Renders nested comment replies with collapse/expand functionality.
 *
 * Features:
 * - Recursive rendering of nested comments
 * - Collapsed preview showing reply count and first reply snippet
 * - Depth limit message when max depth reached
 * - Smooth expand/collapse animation
 *
 * @param props - Component props
 * @returns JSX.Element rendered replies or null if no replies
 */
export function CommentReplies({
  comment,
  isExpanded,
  maxDepth
}: Readonly<CommentRepliesProps>) {
  const hasReplies = comment.replies && comment.replies.length > 0

  if (!hasReplies || !comment.replies) {
    return null
  }

  const replies = comment.replies

  // Depth limit reached - show message
  if (comment.depth >= maxDepth) {
    return (
      <Box ml="md" mt="sm">
        <Text c="dimmed" fs="italic" size="sm">
          {replies.length} more {replies.length === 1 ? 'reply' : 'replies'}{' '}
          (depth limit reached)
        </Text>
      </Box>
    )
  }

  // Render nested replies
  return (
    <>
      <Collapse in={isExpanded}>
        <Stack gap="sm" mt="sm">
          {replies.map((reply) => (
            <CommentItem
              comment={reply}
              key={reply.id || reply.permalink}
              maxDepth={maxDepth}
            />
          ))}
        </Stack>
      </Collapse>

      {!isExpanded && (
        <output
          aria-label="Collapsed replies preview"
          className={classes.collapsedPreview}
        >
          <Text c="dimmed" mb={4} size="xs">
            {replies.length} {replies.length === 1 ? 'reply' : 'replies'}{' '}
            collapsed
          </Text>
          {replies[0]?.body && (
            <Text
              c="dimmed"
              dangerouslySetInnerHTML={{
                __html: decodeAndSanitizeHtml(
                  `${replies[0].author}: ${replies[0].body.slice(0, 100)}${replies[0].body.length > 100 ? '...' : ''}`
                )
              }}
              lineClamp={1}
              size="xs"
            />
          )}
        </output>
      )}
    </>
  )
}
