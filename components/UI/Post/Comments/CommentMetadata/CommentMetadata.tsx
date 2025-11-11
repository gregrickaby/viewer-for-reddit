import {VoteButtons} from '@/components/UI/Post/VoteButtons/VoteButtons'
import type {NestedCommentData} from '@/lib/utils/formatting/comments/commentFilters'
import {ActionIcon, Group, Text, Tooltip} from '@mantine/core'
import {BiComment, BiLinkExternal} from 'react-icons/bi'

/**
 * Props for the CommentMetadata component.
 */
interface CommentMetadataProps {
  /** The comment data */
  comment: NestedCommentData
  /** Whether to show reply controls */
  showReplies: boolean
  /** Whether the comment has replies */
  hasReplies: boolean | number | undefined
}

/**
 * Renders comment metadata including votes and reply count.
 *
 * Features:
 * - Vote buttons with current score
 * - Reply count indicator
 * - External Reddit link
 * - Analytics tracking for interactions
 *
 * @param {CommentMetadataProps} props - Component props
 * @returns JSX.Element metadata controls for the comment
 */
export function CommentMetadata({
  comment,
  showReplies,
  hasReplies
}: Readonly<CommentMetadataProps>) {
  const replyCount = showReplies ? (comment.replies?.length ?? 0) : 0

  return (
    <Group mt="xs" justify="space-between">
      <Group gap="xs" align="center">
        <VoteButtons
          id={comment.name ?? ''}
          score={comment.ups ?? 0}
          userVote={comment.likes}
          size="sm"
          type="comment"
        />

        {hasReplies && (
          <Group gap={4} align="center">
            <BiComment size={16} style={{opacity: 0.6}} aria-hidden="true" />
            <Text
              size="sm"
              c="dimmed"
              aria-label={`${replyCount} ${replyCount === 1 ? 'reply' : 'replies'}`}
            >
              {replyCount}
            </Text>
          </Group>
        )}
      </Group>

      <Group gap="md">
        <Tooltip label="View on Reddit (opens in new tab)" position="top">
          <ActionIcon
            aria-label="View on Reddit (opens in new tab)"
            component="a"
            href={`https://reddit.com${comment.permalink}`}
            rel="noopener noreferrer"
            size="sm"
            target="_blank"
            variant="subtle"
          >
            <BiLinkExternal size={16} aria-hidden="true" />
          </ActionIcon>
        </Tooltip>
      </Group>
    </Group>
  )
}
