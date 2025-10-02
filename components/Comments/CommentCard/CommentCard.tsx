import {VoteButtons} from '@/components/VoteButtons/VoteButtons'
import type {AutoCommentWithText} from '@/lib/store/services/commentsApi'
import {hasRequiredCommentFields} from '@/lib/utils/commentHelpers'
import {formatTimeAgo} from '@/lib/utils/formatTimeAgo'
import {logError} from '@/lib/utils/logError'
import {decodeAndSanitizeHtml} from '@/lib/utils/sanitizeText'
import {Anchor, Card, Group, Text} from '@mantine/core'
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
        className={styles.commentCard}
        role="alert"
        aria-label="Invalid comment error"
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
          <Anchor
            href={`https://reddit.com/user/${comment.author || 'unknown'}`}
            rel="noopener noreferrer"
            target="_blank"
            aria-label={`View profile of ${comment.author || 'Unknown'}`}
          >
            <Text c="dimmed" size="sm">
              {comment.author || 'Unknown'}
            </Text>
          </Anchor>
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

        <section
          className={styles.commentBody}
          aria-label="Comment content"
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
