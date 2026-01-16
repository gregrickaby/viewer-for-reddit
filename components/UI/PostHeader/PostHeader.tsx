import {RedditPost} from '@/lib/types/reddit'
import {formatTimeAgo} from '@/lib/utils/formatters'
import {Anchor, Badge, Group, Text} from '@mantine/core'
import Link from 'next/link'

/**
 * Props for the PostHeader component.
 */
interface PostHeaderProps {
  /** Reddit post data */
  post: RedditPost
}

/**
 * Display post metadata header (subreddit, author, time, NSFW badge).
 * Shows at the top of PostCard components.
 *
 * @example
 * ```typescript
 * <PostHeader post={redditPost} />
 * ```
 */
export function PostHeader({post}: Readonly<PostHeaderProps>) {
  // Don't link to deleted/removed authors (Next.js treats brackets as dynamic routes)
  const isDeletedAuthor =
    post.author === '[deleted]' || post.author === '[removed]'

  return (
    <Group justify="space-between" wrap="nowrap" gap="xs">
      <Group gap={6}>
        <Badge
          variant="light"
          size="xs"
          component={Link}
          href={`/r/${post.subreddit}`}
          style={{cursor: 'pointer'}}
        >
          {post.subreddit_name_prefixed}
        </Badge>
        <Text size="xs" c="dimmed">
          Posted by{' '}
          {isDeletedAuthor ? (
            <Text span size="xs" c="dimmed">
              u/{post.author}
            </Text>
          ) : (
            <Anchor
              component={Link}
              href={`/u/${post.author}`}
              size="xs"
              c="dimmed"
            >
              u/{post.author}
            </Anchor>
          )}{' '}
          • {formatTimeAgo(post.created_utc)}
        </Text>
      </Group>
      {post.over_18 && (
        <Badge color="red" size="sm">
          NSFW
        </Badge>
      )}
    </Group>
  )
}
