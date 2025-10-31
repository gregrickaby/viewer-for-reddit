import {CommentAuthor} from '@/components/UI/Post/Comments/CommentAuthor/CommentAuthor'
import {CommentMedia} from '@/components/UI/Post/Comments/CommentMedia/CommentMedia'
import type {NestedCommentData} from '@/lib/utils/formatting/commentFilters'
import {stripMediaLinks} from '@/lib/utils/formatting/commentMediaHelpers'
import {formatTimeAgo} from '@/lib/utils/formatting/formatTimeAgo'
import {decodeAndSanitizeHtml} from '@/lib/utils/validation/sanitizeText'
import {Group, Stack, Text} from '@mantine/core'
import classes from '../../CommentItem.module.css'

/**
 * Props for CommentContent component.
 */
interface CommentContentProps {
  /** Comment data to render */
  comment: NestedCommentData
  /** Whether comment is deleted */
  isDeleted: boolean
}

/**
 * Renders comment body content including author, timestamp, and body.
 *
 * Features:
 * - Author name with styling
 * - Relative timestamp (e.g., "2 hours ago")
 * - Sanitized HTML body with media links stripped
 * - Inline media (images/videos)
 * - Deleted state display
 *
 * @param props - Component props
 * @returns JSX.Element rendered comment content
 */
export function CommentContent({
  comment,
  isDeleted
}: Readonly<CommentContentProps>) {
  return (
    <Stack gap="xs">
      <Group gap="xs" align="center">
        <CommentAuthor author={comment.author} />
        <Text c="dimmed" size="sm">
          &middot;
        </Text>
        <Text c="dimmed" size="xs">
          {formatTimeAgo(comment.created_utc ?? 0)}
        </Text>
        {isDeleted && (
          <>
            <Text c="dimmed" size="sm">
              &middot;
            </Text>
            <Text c="red" size="xs" fw={500}>
              deleted
            </Text>
          </>
        )}
      </Group>

      {isDeleted ? (
        <Text c="dimmed" fs="italic" size="sm">
          [deleted]
        </Text>
      ) : (
        <>
          <section
            className={classes.commentBody}
            dangerouslySetInnerHTML={{
              __html: stripMediaLinks(
                decodeAndSanitizeHtml(comment.body_html ?? comment.body ?? '')
              )
            }}
          />

          <CommentMedia
            bodyHtml={decodeAndSanitizeHtml(comment.body_html ?? '')}
          />
        </>
      )}
    </Stack>
  )
}
