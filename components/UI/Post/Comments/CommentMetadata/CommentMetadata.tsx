import {VoteButtons} from '@/components/UI/Post/VoteButtons/VoteButtons'
import type {NestedCommentData} from '@/lib/utils/formatting/comments/commentFilters'
import {ActionIcon, Group, Text, Tooltip} from '@mantine/core'
import {
  BiChevronRight,
  BiCollapseVertical,
  BiComment,
  BiExpandVertical,
  BiLinkExternal
} from 'react-icons/bi'
import classes from './CommentMetadata.module.css'

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
  /** Whether replies are currently expanded */
  isExpanded: boolean
  /** Whether all descendants are fully expanded */
  isSubtreeFullyExpanded: boolean
  /** Handler for toggling reply expansion */
  toggleExpansion: () => void
  /** Handler for toggling all descendants */
  toggleSubtreeExpansion: () => void
}

/**
 * Renders comment metadata including votes, reply count, and expansion controls.
 *
 * Features:
 * - Vote buttons with current score
 * - Reply count indicator
 * - Expand/collapse replies button
 * - Expand/collapse all descendants button
 * - External Reddit link
 * - Keyboard shortcuts (O/Shift+O for expand/collapse all)
 * - Analytics tracking for interactions
 *
 * @param {CommentMetadataProps} props - Component props
 * @returns JSX.Element metadata controls for the comment
 */
export function CommentMetadata({
  comment,
  showReplies,
  hasReplies,
  isExpanded,
  isSubtreeFullyExpanded,
  toggleExpansion,
  toggleSubtreeExpansion
}: Readonly<CommentMetadataProps>) {
  const depth = comment.depth ?? 0
  let depthLevel = 'level-3+'
  if (depth === 1) {
    depthLevel = 'level-1'
  } else if (depth === 2) {
    depthLevel = 'level-2'
  }

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

        {showReplies && (
          <Group gap={4}>
            <Tooltip
              label={isExpanded ? 'Collapse replies' : 'Expand replies'}
              position="top"
            >
              <ActionIcon
                aria-label={isExpanded ? 'Collapse replies' : 'Expand replies'}
                className={classes.expandButton}
                data-expanded={isExpanded}
                data-umami-event={`comment ${isExpanded ? 'collapse' : 'expand'} ${depthLevel}`}
                onClick={toggleExpansion}
                size="sm"
                variant="subtle"
              >
                <BiChevronRight size={16} />
              </ActionIcon>
            </Tooltip>

            {hasReplies && comment.replies && comment.replies.length > 0 && (
              <Tooltip
                label={
                  isSubtreeFullyExpanded
                    ? 'Collapse all descendants (Shift+O)'
                    : 'Expand all descendants (O)'
                }
                position="top"
              >
                <ActionIcon
                  variant="subtle"
                  size="sm"
                  onClick={toggleSubtreeExpansion}
                  className={classes.expandAllButton}
                  data-expanded={isSubtreeFullyExpanded}
                  data-umami-event={
                    isSubtreeFullyExpanded
                      ? 'collapse all comments'
                      : 'expand all comments'
                  }
                  aria-label={
                    isSubtreeFullyExpanded
                      ? 'Collapse all descendants (Shift+O)'
                      : 'Expand all descendants (O)'
                  }
                >
                  {isSubtreeFullyExpanded ? (
                    <BiCollapseVertical size={16} />
                  ) : (
                    <BiExpandVertical size={16} />
                  )}
                </ActionIcon>
              </Tooltip>
            )}
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
