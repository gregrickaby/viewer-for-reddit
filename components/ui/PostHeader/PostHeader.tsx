import {TimeAgo} from '@/components/ui/TimeAgo/TimeAgo'
import {RedditPost} from '@/lib/types/reddit'
import {getUserProfileHref} from '@/lib/utils/reddit-helpers'
import {Anchor, Badge, Group, Text} from '@mantine/core'
import Link from 'next/link'

/**
 * Props for the PostHeader component.
 */
interface PostHeaderProps {
  /** Reddit post data */
  post: RedditPost
}

/** Display post metadata header (subreddit, author, time, NSFW badge). Shows at the top of PostCard. */
export function PostHeader({post}: Readonly<PostHeaderProps>) {
  const authorHref = getUserProfileHref(post.author)

  return (
    <Group justify="space-between" wrap="nowrap" gap="xs">
      <Group gap={6}>
        <Badge
          component={Link}
          href={`/r/${post.subreddit}`}
          scroll
          size="xs"
          style={{cursor: 'pointer'}}
          variant="light"
        >
          {post.subreddit_name_prefixed}
        </Badge>
        <Text size="xs" c="dimmed">
          Posted by{' '}
          {authorHref ? (
            <Anchor
              c="dimmed"
              component={Link}
              href={authorHref}
              scroll
              size="xs"
            >
              u/{post.author}
            </Anchor>
          ) : (
            <Text span size="xs" c="dimmed">
              u/{post.author}
            </Text>
          )}{' '}
          • <TimeAgo timestamp={post.created_utc} />
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
