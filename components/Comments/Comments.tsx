import type {AutoCommentData} from '@/lib/store/services/redditApi'
import {formatTimeAgo} from '@/lib/utils/formatTimeAgo'
import {decodeAndSanitizeHtml} from '@/lib/utils/sanitizeText'
import {Anchor, Card, Group, NumberFormatter, Text} from '@mantine/core'
import Link from 'next/link'
import {BiSolidUpvote} from 'react-icons/bi'
import classes from './Comments.module.css'

interface CommentsProps {
  comment: AutoCommentData
  showContext?: boolean
  showScore?: boolean
}

/**
 * Comments component.
 *
 * This component handles both post comments and user comments with proper typing
 * and consistent styling.
 *
 * @param comment - The comment data from Reddit API
 * @param showContext - Whether to show subreddit context (for user comments)
 * @param showScore - Whether to show the comment score/upvotes
 */
export function Comments({
  comment,
  showContext = false,
  showScore = true
}: Readonly<CommentsProps>) {
  // Early return if no comment data.
  if (!comment?.id) return null

  // Safely access comment fields that may not be typed
  const commentWithExtraFields = comment as AutoCommentData & {
    link_title?: string
    body_html?: string
    body?: string
  }

  return (
    <Card
      key={comment.id}
      component="article"
      padding="md"
      radius="md"
      shadow="none"
      withBorder
      className={classes.comment}
    >
      <Group gap="xs">
        {comment.author && (
          <Link href={`/u/${comment.author}`} className={classes.authorLink}>
            <Text size="sm">{comment.author}</Text>
          </Link>
        )}

        {showContext && comment.subreddit && (
          <>
            &middot;
            <Text c="dimmed" size="sm">
              in r/{comment.subreddit}
            </Text>
          </>
        )}

        {comment.created_utc && (
          <>
            &middot;
            <Text c="dimmed" size="sm">
              {formatTimeAgo(comment.created_utc)}
            </Text>
          </>
        )}
      </Group>

      {/* Show link context for user comments */}
      {showContext && commentWithExtraFields.link_title && (
        <Text size="sm" mt="xs">
          Re: {commentWithExtraFields.link_title}
        </Text>
      )}

      <div
        className={classes.commentBody}
        dangerouslySetInnerHTML={{
          __html: decodeAndSanitizeHtml(
            commentWithExtraFields.body_html ??
              commentWithExtraFields.body ??
              ''
          )
        }}
      />

      <Group gap="md">
        {showScore && comment.ups !== undefined && (
          <Group className={classes.meta}>
            <BiSolidUpvote size={16} color="red" />
            <Text size="sm" c="dimmed">
              <NumberFormatter value={comment.ups} thousandSeparator />
            </Text>
          </Group>
        )}

        {comment.permalink && (
          <Anchor
            href={`https://reddit.com${comment.permalink}`}
            rel="noopener noreferrer"
            target="_blank"
          >
            <Text size="sm" c="dimmed">
              View on Reddit
            </Text>
          </Anchor>
        )}
      </Group>
    </Card>
  )
}
