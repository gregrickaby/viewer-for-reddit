'use client'

import {VoteButtons} from '@/components/VoteButtons/VoteButtons'
import type {NestedCommentData} from '@/lib/utils/commentFilters'
import {formatTimeAgo} from '@/lib/utils/formatTimeAgo'
import {decodeAndSanitizeHtml} from '@/lib/utils/sanitizeText'
import {
  ActionIcon,
  Anchor,
  Badge,
  Box,
  Card,
  Collapse,
  Group,
  Stack,
  Text,
  Tooltip
} from '@mantine/core'
import Link from 'next/link'
import {
  BiChevronRight,
  BiCollapseVertical,
  BiExpandVertical
} from 'react-icons/bi'
import {useCommentExpansion} from '../CommentExpansionContext/CommentExpansionContext'
import classes from './CommentItem.module.css'

interface CommentItemProps {
  comment: NestedCommentData
  maxDepth?: number
}

export function CommentItem({
  comment,
  maxDepth = 4
}: Readonly<CommentItemProps>) {
  const {
    isCommentExpanded,
    isSubtreeExpanded,
    toggleComment,
    toggleCommentSubtree
  } = useCommentExpansion()

  // Use the comment's ID or permalink as the unique identifier
  const commentId = comment.id || comment.permalink || ''
  const isExpanded = isCommentExpanded(commentId)
  const isSubtreeFullyExpanded = isSubtreeExpanded(commentId)

  const toggleExpansion = () => {
    toggleComment(commentId)
  }

  const toggleSubtreeExpansion = () => {
    toggleCommentSubtree(commentId, comment)
  }

  const hasReplies =
    comment.hasReplies && comment.replies && comment.replies.length > 0
  const showReplies = hasReplies && comment.depth < maxDepth

  return (
    <Box
      className={classes.commentItem}
      style={
        {
          '--comment-depth': comment.depth
        } as React.CSSProperties
      }
      data-testid={`comment-item-depth-${comment.depth}`}
    >
      {/* Thread line for nested comments */}
      {comment.depth > 0 && (
        <div className={classes.threadLine} data-testid="thread-line" />
      )}

      <div
        className={`${classes.commentContent} ${comment.depth > 0 ? classes.nestedComment : ''}`}
      >
        <Card
          component="article"
          padding="md"
          radius="md"
          shadow="none"
          withBorder
        >
          <Stack gap="xs">
            {/* Comment header */}
            <Group gap="xs" align="center">
              <Link className={classes.link} href={`/u/${comment.author}`}>
                <Text c="dimmed" size="sm" fw={700}>
                  u/{comment.author}
                </Text>
              </Link>

              <Text c="dimmed" size="sm">
                &middot;
              </Text>

              <Text c="dimmed" size="xs">
                {formatTimeAgo(comment.created_utc ?? 0)}
              </Text>
            </Group>

            {/* Comment body */}
            <div
              className={classes.commentBody}
              dangerouslySetInnerHTML={{
                __html: decodeAndSanitizeHtml(
                  comment.body_html ?? comment.body ?? ''
                )
              }}
            />

            {/* Comment metadata */}
            <Group className={classes.commentMeta} justify="space-between">
              {/* Expand/collapse functionality moved to bottom left */}
              {showReplies ? (
                <Group gap="xs" align="center">
                  <VoteButtons
                    id={comment.name ?? ''}
                    score={comment.ups ?? 0}
                    userVote={comment.likes}
                    size="sm"
                  />
                  <Badge
                    variant="light"
                    size="md"
                    className={classes.replyCount}
                  >
                    {comment.replies!.length}{' '}
                    {comment.replies!.length === 1 ? 'reply' : 'replies'}
                  </Badge>

                  {/* Regular expand/collapse button */}
                  <Tooltip
                    label={isExpanded ? 'Collapse replies' : 'Expand replies'}
                    position="top"
                  >
                    <ActionIcon
                      variant="subtle"
                      size="sm"
                      onClick={toggleExpansion}
                      className={classes.expandButton}
                      data-expanded={isExpanded}
                      aria-label={
                        isExpanded ? 'Collapse replies' : 'Expand replies'
                      }
                    >
                      <BiChevronRight size={16} />
                    </ActionIcon>
                  </Tooltip>

                  {/* Expand/collapse ALL descendants button */}
                  <Tooltip
                    label={
                      isSubtreeFullyExpanded
                        ? 'Collapse all descendants'
                        : 'Expand all descendants'
                    }
                    position="top"
                  >
                    <ActionIcon
                      variant="subtle"
                      size="sm"
                      onClick={toggleSubtreeExpansion}
                      className={classes.expandAllButton}
                      data-expanded={isSubtreeFullyExpanded}
                      aria-label={
                        isSubtreeFullyExpanded
                          ? 'Collapse all descendants'
                          : 'Expand all descendants'
                      }
                    >
                      {isSubtreeFullyExpanded ? (
                        <BiCollapseVertical size={16} />
                      ) : (
                        <BiExpandVertical size={16} />
                      )}
                    </ActionIcon>
                  </Tooltip>
                </Group>
              ) : (
                <div />
              )}

              <Group gap="md">
                <Anchor
                  href={`https://reddit.com${comment.permalink}`}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <Text size="sm" c="dimmed">
                    View comment on Reddit
                  </Text>
                </Anchor>
              </Group>
            </Group>
          </Stack>
        </Card>

        {/* Nested replies */}
        {showReplies && (
          <Collapse in={isExpanded}>
            <Stack gap="sm" mt="sm">
              {comment.replies!.map((reply) => (
                <CommentItem
                  key={reply.id || reply.permalink}
                  comment={reply}
                  maxDepth={maxDepth}
                />
              ))}
            </Stack>
          </Collapse>
        )}

        {/* Depth limit indicator */}
        {hasReplies && comment.depth >= maxDepth && (
          <Box mt="sm" ml="md">
            <Text size="sm" c="dimmed" fs="italic">
              {comment.replies!.length} more{' '}
              {comment.replies!.length === 1 ? 'reply' : 'replies'} (depth limit
              reached)
            </Text>
          </Box>
        )}
      </div>
    </Box>
  )
}
