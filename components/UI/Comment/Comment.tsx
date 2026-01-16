'use client'

import {useVote} from '@/lib/hooks'
import {RedditComment as RedditCommentType} from '@/lib/types/reddit'
import {decodeHtmlEntities, formatTimeAgo} from '@/lib/utils/formatters'
import {getVoteColor} from '@/lib/utils/reddit-helpers'
import {ActionIcon, Badge, Card, Group, Stack, Text} from '@mantine/core'
import {IconArrowDown, IconArrowUp} from '@tabler/icons-react'
import DOMPurify from 'isomorphic-dompurify'
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
  isAuthenticated = false
}: Readonly<CommentProps>) {
  const {voteState, score, isPending, vote} = useVote({
    itemName: comment.name,
    initialLikes: comment.likes,
    initialScore: comment.score
  })

  const replies =
    comment.replies?.data?.children?.filter(
      (child): child is {kind: 't1'; data: RedditCommentType} =>
        child.kind === 't1'
    ) || []

  return (
    <div style={{marginLeft: depth > 0 ? 20 : 0}}>
      <Card withBorder padding="md" radius="md" mb="sm">
        <Stack gap="sm">
          <Group gap="xs">
            <Text size="sm" fw={600}>
              u/{comment.author}
            </Text>
            {comment.distinguished && (
              <Badge size="xs" color="green">
                {comment.distinguished}
              </Badge>
            )}
            <Text size="xs" c="dimmed">
              • {formatTimeAgo(comment.created_utc)}
            </Text>
          </Group>

          <div
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(
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
                style={{
                  cursor: isAuthenticated ? 'pointer' : 'not-allowed',
                  opacity: isAuthenticated ? 1 : 0.5
                }}
                aria-label={`${voteState === 1 ? 'Upvoted' : 'Upvote'} comment (${score} points)`}
                aria-disabled={!isAuthenticated}
                data-umami-event="comment-upvote"
              >
                <IconArrowUp size={14} />
              </ActionIcon>
              <Text size="xs" fw={600} c={getVoteColor(voteState)}>
                {score}
              </Text>
              <ActionIcon
                variant="subtle"
                size="sm"
                color={voteState === -1 ? 'blue' : 'gray'}
                onClick={() => isAuthenticated && vote(-1)}
                loading={isPending}
                disabled={!isAuthenticated}
                style={{
                  cursor: isAuthenticated ? 'pointer' : 'not-allowed',
                  opacity: isAuthenticated ? 1 : 0.5
                }}
                aria-label={`${voteState === -1 ? 'Downvoted' : 'Downvote'} comment (${score} points)`}
                aria-disabled={!isAuthenticated}
                data-umami-event="comment-downvote"
              >
                <IconArrowDown size={14} />
              </ActionIcon>
            </Group>
          </Group>
        </Stack>
      </Card>

      {replies.map((reply) => (
        <Comment
          key={reply.data.id}
          comment={reply.data}
          depth={depth + 1}
          isAuthenticated={isAuthenticated}
        />
      ))}
    </div>
  )
}
