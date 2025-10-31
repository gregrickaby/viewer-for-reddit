'use client'

import {CommentMedia} from '@/components/UI/Post/Comments/CommentMedia/CommentMedia'
import {VoteButtons} from '@/components/UI/Post/VoteButtons/VoteButtons'
import {COMMENT_CONFIG} from '@/lib/config'
import {
  collapseComment,
  collapseSubtree,
  expandComment,
  expandSubtree,
  selectIsCommentExpanded,
  selectIsSubtreeExpanded
} from '@/lib/store/features/commentExpansionSlice'
import {useAppDispatch, useAppSelector} from '@/lib/store/hooks'
import type {NestedCommentData} from '@/lib/utils/formatting/commentFilters'
import {collectDescendantIds} from '@/lib/utils/formatting/commentHelpers'
import {stripMediaLinks} from '@/lib/utils/formatting/commentMediaHelpers'
import {formatTimeAgo} from '@/lib/utils/formatting/formatTimeAgo'
import {decodeAndSanitizeHtml} from '@/lib/utils/validation/sanitizeText'
import {
  ActionIcon,
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
  BiComment,
  BiExpandVertical,
  BiLinkExternal
} from 'react-icons/bi'
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
  hasReplies,
  isExpanded,
  isSubtreeFullyExpanded,
  toggleExpansion,
  toggleSubtreeExpansion
}: Readonly<{
  comment: NestedCommentData
  showReplies: boolean
  hasReplies: boolean | number | undefined
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

  const replyCount = showReplies ? comment.replies!.length : 0

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

        {hasReplies && (
          <Group gap={4} align="center">
            <BiComment size={16} style={{opacity: 0.6}} />
            <Text size="sm" c="dimmed">
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
        <Tooltip label="View on Reddit" position="top">
          <ActionIcon
            aria-label="View on Reddit"
            component="a"
            href={`https://reddit.com${comment.permalink}`}
            rel="noopener noreferrer"
            size="sm"
            target="_blank"
            variant="subtle"
          >
            <BiLinkExternal size={16} />
          </ActionIcon>
        </Tooltip>
      </Group>
    </Group>
  )
}

export function CommentItem({
  comment,
  maxDepth = COMMENT_CONFIG.MAX_DEPTH
}: Readonly<CommentItemProps>) {
  const dispatch = useAppDispatch()

  const commentId = comment.id || comment.permalink || ''
  const isExpanded = useAppSelector((state) =>
    selectIsCommentExpanded(state, commentId, comment.depth)
  )
  const isSubtreeFullyExpanded = useAppSelector((state) =>
    selectIsSubtreeExpanded(state, commentId)
  )

  const toggleExpansion = () => {
    if (isExpanded) {
      dispatch(collapseComment(commentId))
    } else {
      dispatch(expandComment(commentId))
    }
  }

  const toggleSubtreeExpansion = () => {
    const descendantIds = collectDescendantIds(comment)
    if (isSubtreeFullyExpanded) {
      dispatch(collapseSubtree({id: commentId, descendantIds}))
    } else {
      dispatch(expandSubtree({id: commentId, descendantIds}))
    }
  }

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
      data-comment-id={commentId}
      data-comment-depth={comment.depth}
      tabIndex={-1}
    >
      {comment.depth > 0 && (
        <div className={classes.threadLine} data-testid="thread-line" />
      )}

      <div
        className={`${classes.commentContent} ${comment.depth > 0 ? classes.nestedComment : ''}`}
      >
        <Card component="article" padding="md" radius="md" shadow="none">
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
                __html: stripMediaLinks(
                  decodeAndSanitizeHtml(comment.body_html ?? comment.body ?? '')
                )
              }}
            />

            <CommentMedia
              bodyHtml={decodeAndSanitizeHtml(comment.body_html ?? '')}
            />

            <CommentMetadata
              comment={comment}
              showReplies={!!showReplies}
              hasReplies={hasReplies}
              isExpanded={isExpanded}
              isSubtreeFullyExpanded={isSubtreeFullyExpanded}
              toggleExpansion={toggleExpansion}
              toggleSubtreeExpansion={toggleSubtreeExpansion}
            />
          </Stack>
        </Card>

        {showReplies && (
          <>
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

            {!isExpanded && comment.replies && comment.replies.length > 0 && (
              <Box className={classes.collapsedPreview} mt="xs">
                <Text size="xs" c="dimmed" mb={4}>
                  {comment.replies.length}{' '}
                  {comment.replies.length === 1 ? 'reply' : 'replies'} collapsed
                </Text>
                {comment.replies[0]?.body && (
                  <Text size="xs" c="dimmed" lineClamp={1}>
                    {comment.replies[0].author}:{' '}
                    {comment.replies[0].body.slice(0, 100)}
                    {comment.replies[0].body.length > 100 ? '...' : ''}
                  </Text>
                )}
              </Box>
            )}
          </>
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
