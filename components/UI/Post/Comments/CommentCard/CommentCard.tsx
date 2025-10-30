import {VoteButtons} from '@/components/UI/Post/VoteButtons/VoteButtons'
import type {AutoCommentWithText} from '@/lib/store/services/commentsApi'
import {hasRequiredCommentFields} from '@/lib/utils/formatting/commentHelpers'
import {formatTimeAgo} from '@/lib/utils/formatting/formatTimeAgo'
import {logError} from '@/lib/utils/logging/logError'
import {decodeAndSanitizeHtml} from '@/lib/utils/validation/sanitizeText'
import {Anchor, Card, Group, Text} from '@mantine/core'
import Link from 'next/link'
import {memo} from 'react'
import styles from './CommentCard.module.css'

interface CommentCardProps {
  comment: AutoCommentWithText & {
    id?: string
    permalink?: string
    author?: string
    created_utc?: number
    ups?: number
  }
}

function CommentCardComponent({comment}: Readonly<CommentCardProps>) {
  // Security validation using existing helper
  if (!hasRequiredCommentFields(comment)) {
    // Maintain backward compatibility with existing tests
    console.warn('Invalid comment data received:', comment)

    // Also use structured logging for production
    logError('Invalid comment data received', {
      context: 'CommentCard',
      commentId: (comment as any).id || 'unknown',
      commentData: comment
    })

    return (
      <article
        aria-label="Invalid comment error"
        className={styles.commentCard}
        role="alert"
      >
        <Text size="sm" c="dimmed">
          <span className={styles.srOnly}>Error: </span>
          <span>Comment data is invalid and cannot be displayed</span>
        </Text>
      </article>
    )
  }
  return (
    <article
      className={styles.commentCard}
      aria-label={`Comment by ${comment.author || 'Unknown'}`}
    >
      <Card padding="md" radius="md" shadow="none" withBorder>
        <Group gap="xs">
          {comment.author &&
          !['[deleted]', '[removed]'].includes(comment.author) ? (
            <Link
              aria-label={`View profile of ${comment.author}`}
              href={`/u/${comment.author}`}
            >
              <Text c="dimmed" size="sm">
                {comment.author}
              </Text>
            </Link>
          ) : (
            <Text c="dimmed" size="sm">
              {comment.author || 'Unknown'}
            </Text>
          )}
          <Text c="dimmed" size="sm" aria-hidden="true">
            &middot;
          </Text>
          <Text c="dimmed" size="sm">
            <time
              dateTime={new Date(
                (comment.created_utc ?? 0) * 1000
              ).toISOString()}
            >
              {formatTimeAgo(comment.created_utc ?? 0)}
            </time>
          </Text>
        </Group>

        <div
          className={styles.commentBody}
          dangerouslySetInnerHTML={{
            __html: decodeAndSanitizeHtml(
              comment.body_html ?? comment.body ?? ''
            )
          }}
        />

        <Group gap="md">
          <VoteButtons
            id={comment.name ?? ''}
            score={comment.ups ?? 0}
            userVote={comment.likes}
            size="sm"
            type="comment"
          />
          <Anchor
            href={`https://reddit.com${comment.permalink ?? ''}`}
            rel="noopener noreferrer"
            target="_blank"
            aria-label="View comment on Reddit"
          >
            <Text size="sm" c="dimmed">
              View on Reddit
            </Text>
          </Anchor>
        </Group>
      </Card>
    </article>
  )
}

// Performance: Memoize component to prevent unnecessary re-renders
export const CommentCard = memo(CommentCardComponent)
