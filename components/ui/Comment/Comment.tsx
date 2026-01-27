'use client'

import {useSavePost, useVote} from '@/lib/hooks'
import {RedditComment as RedditCommentType} from '@/lib/types/reddit'
import {
  decodeHtmlEntities,
  formatTimeAgo,
  sanitizeText
} from '@/lib/utils/formatters'
import {getVoteColor} from '@/lib/utils/reddit-helpers'
import {
  ActionIcon,
  Anchor,
  Badge,
  Box,
  Card,
  Collapse,
  Group,
  NumberFormatter,
  Stack,
  Text
} from '@mantine/core'
import {notifications} from '@mantine/notifications'
import {
  IconArrowDown,
  IconArrowUp,
  IconBookmark,
  IconBookmarkFilled,
  IconChevronDown,
  IconChevronUp,
  IconShare
} from '@tabler/icons-react'
import Link from 'next/link'
import {useState} from 'react'
import styles from './Comment.module.css'

/**
 * Props for the Comment component.
 */
interface CommentProps {
  /** Reddit comment data */
  comment: RedditCommentType
  /** Nesting depth (for indentation) */
  depth?: number
  /** Whether the current user is authenticated */
  isAuthenticated?: boolean
  /** Optional callback when item is unsaved (for saved items list) */
  onUnsave?: () => void
}

/**
 * Display a Reddit comment with voting and nested replies.
 * Recursively renders child comments with proper indentation.
 *
 * Features:
 * - Optimistic voting with useVote hook
 * - HTML sanitization for comment body
 * - Distinguished user badges (mod, admin)
 * - Recursive rendering for nested replies
 * - Indentation based on depth
 * - Collapsible top-level comments with child replies
 *
 * @example
 * ```typescript
 * <Comment
 *   comment={redditComment}
 *   depth={0}
 *   isAuthenticated={true}
 * />
 * ```
 */
export function Comment({
  comment,
  depth = 0,
  isAuthenticated = false,
  onUnsave
}: Readonly<CommentProps>) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const {
    voteState,
    score,
    isPending: isVotePending,
    vote
  } = useVote({
    itemName: comment.name,
    initialLikes: comment.likes,
    initialScore: comment.score
  })

  const {
    isSaved,
    isPending: isSavePending,
    toggleSave
  } = useSavePost({
    postName: comment.name,
    initialSaved: comment.saved || false,
    onUnsave
  })

  const isPending = isVotePending || isSavePending

  const replies =
    comment.replies?.data?.children?.filter(
      (child): child is {kind: 't1'; data: RedditCommentType} =>
        child.kind === 't1'
    ) || []

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed)
  }

  const handleShare = async () => {
    try {
      const url = `${window.location.origin}${comment.permalink}`
      await navigator.clipboard.writeText(url)
      notifications.show({
        message: 'Link copied to clipboard',
        color: 'teal',
        autoClose: 3000
      })
    } catch (error) {
      notifications.show({
        message: 'Failed to copy link',
        color: 'red',
        autoClose: 3000
      })
    }
  }

  const handleSave = () => {
    toggleSave()
    notifications.show({
      message: isSaved ? 'Comment unsaved' : 'Comment saved',
      color: isSaved ? 'gray' : 'yellow',
      autoClose: 3000
    })
  }

  // Don't link to deleted/suspended users
  const isSpecialUser =
    comment.author === '[deleted]' ||
    comment.author === '[removed]' ||
    comment.author === 'AutoModerator'

  return (
    <Box ml={depth > 0 ? 20 : 0}>
      <Card withBorder padding="md" radius="md" mb="sm">
        <Stack gap="sm">
          <Group gap="xs">
            {depth === 0 && (
              <ActionIcon
                variant="subtle"
                size="sm"
                color="gray"
                onClick={toggleCollapse}
                aria-label={isCollapsed ? 'Expand comment' : 'Collapse comment'}
                aria-expanded={!isCollapsed}
                data-umami-event={
                  isCollapsed ? 'comment-expand' : 'comment-collapse'
                }
              >
                {isCollapsed ? (
                  <IconChevronDown aria-hidden="true" size={16} />
                ) : (
                  <IconChevronUp aria-hidden="true" size={16} />
                )}
              </ActionIcon>
            )}
            {isSpecialUser ? (
              <Text size="sm" fw={600} c="dimmed">
                u/{comment.author}
              </Text>
            ) : (
              <Anchor
                component={Link}
                href={`/u/${comment.author}`}
                size="sm"
                fw={600}
                underline="hover"
              >
                u/{comment.author}
              </Anchor>
            )}
            {comment.distinguished && (
              <Badge size="xs" color="green">
                {comment.distinguished}
              </Badge>
            )}
            <Text size="xs" c="dimmed">
              • {formatTimeAgo(comment.created_utc)}
            </Text>
            {isCollapsed && replies.length > 0 && (
              <Text size="xs" c="dimmed">
                ({replies.length} {replies.length === 1 ? 'reply' : 'replies'})
              </Text>
            )}
          </Group>

          <Collapse in={!isCollapsed}>
            <Stack gap="sm">
              <div
                dangerouslySetInnerHTML={{
                  __html: sanitizeText(
                    comment.body_html
                      ? decodeHtmlEntities(comment.body_html)
                      : comment.body
                  )
                }}
                className={styles.commentBody}
              />

              <Group gap="sm">
                <Group gap={4}>
                  <ActionIcon
                    variant="subtle"
                    size="sm"
                    color={voteState === 1 ? 'orange' : 'gray'}
                    onClick={() => isAuthenticated && vote(1)}
                    loading={isPending}
                    disabled={!isAuthenticated}
                    className={
                      isAuthenticated
                        ? styles.voteButton
                        : styles.voteButtonDisabled
                    }
                    aria-label={`${voteState === 1 ? 'Upvoted' : 'Upvote'} comment (${score} points)`}
                    aria-disabled={!isAuthenticated}
                    data-umami-event="comment-upvote"
                  >
                    <IconArrowUp aria-hidden="true" size={14} />
                  </ActionIcon>
                  <Text size="xs" fw={600} c={getVoteColor(voteState)}>
                    <NumberFormatter value={score} thousandSeparator="," />
                  </Text>
                  <ActionIcon
                    variant="subtle"
                    size="sm"
                    color={voteState === -1 ? 'blue' : 'gray'}
                    onClick={() => isAuthenticated && vote(-1)}
                    loading={isPending}
                    disabled={!isAuthenticated}
                    className={
                      isAuthenticated
                        ? styles.voteButton
                        : styles.voteButtonDisabled
                    }
                    aria-label={`${voteState === -1 ? 'Downvoted' : 'Downvote'} comment (${score} points)`}
                    aria-disabled={!isAuthenticated}
                    data-umami-event="comment-downvote"
                  >
                    <IconArrowDown aria-hidden="true" size={14} />
                  </ActionIcon>
                </Group>
                <ActionIcon
                  variant="subtle"
                  size="sm"
                  color={isSaved ? 'yellow' : 'gray'}
                  onClick={handleSave}
                  loading={isPending}
                  disabled={!isAuthenticated}
                  className={
                    isAuthenticated
                      ? styles.voteButton
                      : styles.voteButtonDisabled
                  }
                  aria-label={isSaved ? 'Unsave comment' : 'Save comment'}
                  aria-disabled={!isAuthenticated}
                  data-umami-event={isSaved ? 'comment-unsave' : 'comment-save'}
                >
                  {isSaved ? (
                    <IconBookmarkFilled aria-hidden="true" size={14} />
                  ) : (
                    <IconBookmark aria-hidden="true" size={14} />
                  )}
                </ActionIcon>
                <ActionIcon
                  variant="subtle"
                  size="sm"
                  color="gray"
                  onClick={handleShare}
                  aria-label="Share comment"
                  data-umami-event="comment-share"
                >
                  <IconShare aria-hidden="true" size={14} />
                </ActionIcon>
              </Group>
            </Stack>
          </Collapse>
        </Stack>
      </Card>

      <Collapse in={!isCollapsed}>
        {replies.map((reply) => (
          <Comment
            key={reply.data.id}
            comment={reply.data}
            depth={depth + 1}
            isAuthenticated={isAuthenticated}
          />
        ))}
      </Collapse>
    </Box>
  )
}
