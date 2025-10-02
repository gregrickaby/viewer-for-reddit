import type {AutoPostChildData} from '@/lib/store/services/postsApi'
import {formatTimeAgo} from '@/lib/utils/formatTimeAgo'
import {ActionIcon, Anchor, Avatar, Group, Text} from '@mantine/core'
import dayjs from 'dayjs'
import Link from 'next/link'
import {IoEllipsisHorizontal} from 'react-icons/io5'

interface PostHeaderProps {
  post: AutoPostChildData
}

/**
 * PostHeader component displays subreddit info, author, and post metadata.
 *
 * Features:
 * - Subreddit avatar and name
 * - Author and post age
 * - More options menu button
 * - Compact horizontal layout matching Reddit's design
 */
export function PostHeader({post}: Readonly<PostHeaderProps>) {
  const created = post.created_utc
    ? dayjs.unix(post.created_utc).toISOString()
    : ''

  return (
    <Group justify="space-between" wrap="nowrap">
      <Group gap="xs" wrap="nowrap">
        <Avatar
          src={`https://www.reddit.com/${post.subreddit_name_prefixed}/about.json`}
          alt={post.subreddit_name_prefixed}
          size="sm"
          radius="sm"
        />
        <Group gap={4} wrap="nowrap">
          <Anchor
            component={Link}
            href={`/${post.subreddit_name_prefixed}`}
            underline="never"
            c="inherit"
          >
            <Text size="sm" fw={700}>
              {post.subreddit_name_prefixed}
            </Text>
          </Anchor>
          <Text size="xs" c="dimmed">
            •
          </Text>
          <Anchor
            component={Link}
            href={`/u/${post.author}`}
            underline="never"
            c="dimmed"
          >
            <Text size="xs">u/{post.author}</Text>
          </Anchor>
          <Text size="xs" c="dimmed">
            •
          </Text>
          <Text size="xs" c="dimmed">
            <time dateTime={created}>
              {post.created_utc ? formatTimeAgo(post.created_utc) : ''}
            </time>
          </Text>
        </Group>
      </Group>

      <ActionIcon variant="subtle" color="gray" size="sm">
        <IoEllipsisHorizontal size={16} />
      </ActionIcon>
    </Group>
  )
}
