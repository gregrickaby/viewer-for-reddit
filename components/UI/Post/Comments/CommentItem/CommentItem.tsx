'use client'

import {VoteButtons} from '@/components/UI/Post/VoteButtons/VoteButtons'
import type {NestedCommentData} from '@/lib/utils/formatting/commentFilters'
import {formatTimeAgo} from '@/lib/utils/formatting/formatTimeAgo'
import {decodeAndSanitizeHtml} from '@/lib/utils/validation/sanitizeText'
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

/**
 * Render comment author information.
 */
function CommentAuthor({author}: Readonly<{author: string | undefined}>) {
  const isDeletedOrRemoved = ['[deleted]', '[removed]'].includes(author || '')

  if (!author || isDeletedOrRemoved) {
    return (
      <Text c="dimmed" size="sm" fw={700}>
        u/{author || '[deleted]'}
      </Text>
    )
  }

  return (
    <Link className={classes.link} href={`/u/${author}`}>
      <Text c="dimmed" size="sm" fw={700}>
        u/{author}
      </Text>
    </Link>
  )
}

/**
 * Render comment metadata (votes, replies, expand buttons).
 */
function CommentMetadata({
  comment,
  showReplies,
  isExpanded,
  isSubtreeFullyExpanded,
  toggleExpansion,
  toggleSubtreeExpansion
}: Readonly<{
  comment: NestedCommentData
  showReplies: boolean
  isExpanded: boolean
  isSubtreeFullyExpanded: boolean
  toggleExpansion: () => void
  toggleSubtreeExpansion: () => void
}>) {
  const depth = comment.depth
  let depthLevel = 'level-3+'
  if (depth === 1) {
    depthLevel = 'level-1'
  } else if (depth === 2) {
    depthLevel = 'level-2'
  }

  if (!showReplies) {
    return (
      <Group className={classes.commentMeta} justify="space-between">
        <div />
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
    )
  }

  const replyCount = comment.replies!.length
  const replyLabel = replyCount === 1 ? 'reply' : 'replies'

  return (
    <Group className={classes.commentMeta} justify="space-between">
      <Group gap="xs" align="center">
        <VoteButtons
          id={comment.name ?? ''}
          score={comment.ups ?? 0}
          userVote={comment.likes}
          size="sm"
          type="comment"
        />
        <Badge variant="light" size="md" className={classes.replyCount}>
          {replyCount} {replyLabel}
        </Badge>

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
            data-umami-event={`comment ${isExpanded ? 'collapse' : 'expand'} ${depthLevel}`}
            aria-label={isExpanded ? 'Collapse replies' : 'Expand replies'}
          >
            <BiChevronRight size={16} />
          </ActionIcon>
        </Tooltip>

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
      </Group>

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
  )
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

  const commentId = comment.id || comment.permalink || ''
  const isExpanded = isCommentExpanded(commentId)
  const isSubtreeFullyExpanded = isSubtreeExpanded(commentId)

  const toggleExpansion = () => toggleComment(commentId)
  const toggleSubtreeExpansion = () => toggleCommentSubtree(commentId, comment)

  const hasReplies = comment.hasReplies && comment.replies?.length
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
            <Group gap="xs" align="center">
              <CommentAuthor author={comment.author} />
              <Text c="dimmed" size="sm">
                &middot;
              </Text>
              <Text c="dimmed" size="xs">
                {formatTimeAgo(comment.created_utc ?? 0)}
              </Text>
            </Group>

            <div
              className={classes.commentBody}
              dangerouslySetInnerHTML={{
                __html: decodeAndSanitizeHtml(
                  comment.body_html ?? comment.body ?? ''
                )
              }}
            />

            <CommentMetadata
              comment={comment}
              showReplies={!!showReplies}
              isExpanded={isExpanded}
              isSubtreeFullyExpanded={isSubtreeFullyExpanded}
              toggleExpansion={toggleExpansion}
              toggleSubtreeExpansion={toggleSubtreeExpansion}
            />
          </Stack>
        </Card>

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
