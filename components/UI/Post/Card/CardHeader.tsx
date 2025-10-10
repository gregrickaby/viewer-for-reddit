import type {AutoPostChildData} from '@/lib/store/services/postsApi'
import {formatTimeAgo} from '@/lib/utils/formatting/formatTimeAgo'
import {Anchor, Avatar, Group, Stack, Text} from '@mantine/core'
import dayjs from 'dayjs'
import Link from 'next/link'
import AppIcon from '../../../../app/icon.png'

interface CardHeaderProps {
  post: AutoPostChildData
}

/**
 * CardHeader component.
 */
export function CardHeader({post}: Readonly<CardHeaderProps>) {
  const created = post.created_utc
    ? dayjs.unix(post.created_utc).toISOString()
    : ''

  return (
    <Group gap="xs" mb="xs">
      <Avatar
        src={AppIcon.src}
        alt={post.subreddit_name_prefixed}
        size="md"
        radius="sm"
      />

      <Group>
        <Stack gap={1}>
          <Group>
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
          </Group>

          <Group gap="xs">
            {post.author &&
            !['[deleted]', '[removed]'].includes(post.author) ? (
              <Anchor
                component={Link}
                href={`/u/${post.author}`}
                underline="never"
                c="dimmed"
              >
                <Text size="xs">u/{post.author}</Text>
              </Anchor>
            ) : (
              <Text size="xs" c="dimmed">
                u/{post.author || '[deleted]'}
              </Text>
            )}
            <Text size="xs" c="dimmed">
              •
            </Text>
            <Text size="xs" c="dimmed">
              <time dateTime={created}>
                {post.created_utc ? formatTimeAgo(post.created_utc) : ''}
              </time>
            </Text>
          </Group>
        </Stack>
      </Group>
    </Group>
  )
}
