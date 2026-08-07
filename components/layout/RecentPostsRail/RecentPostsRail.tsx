'use client'

import {TimeAgo} from '@/components/ui/TimeAgo/TimeAgo'
import {useRecentPosts} from '@/lib/hooks/useRecentPosts'
import {formatNumber} from '@/lib/utils/formatters'
import {isValidThumbnail} from '@/lib/utils/media-helpers'
import {Anchor, Card, Group, Stack, Text, UnstyledButton} from '@mantine/core'
import Image from 'next/image'
import Link from 'next/link'

/**
 * Right-rail widget listing recently visited posts (tracked by
 * `RecordRecentPost`), persisted in `localStorage` via `useRecentPosts`.
 * Renders nothing when the list is empty, matching the pattern used by the
 * sidebar's other personalized sections.
 */
export function RecentPostsRail() {
  const {recentPosts, clearRecentPosts} = useRecentPosts()

  if (recentPosts.length === 0) {
    return null
  }

  return (
    <aside aria-label="Recent posts">
      <Card withBorder padding="md" radius="md">
        <Group justify="space-between" mb="sm">
          <Text size="xs" fw={700} c="dimmed" tt="uppercase">
            Recent Posts
          </Text>
          <UnstyledButton
            onClick={clearRecentPosts}
            aria-label="Clear recent posts"
          >
            <Text size="xs" c="dimmed">
              Clear
            </Text>
          </UnstyledButton>
        </Group>

        <Stack gap="sm">
          {recentPosts.map((entry) => (
            <Anchor
              key={entry.id}
              component={Link}
              href={entry.permalink}
              underline="never"
              c="inherit"
            >
              <Group gap="sm" wrap="nowrap" align="flex-start">
                {entry.thumbnail && isValidThumbnail(entry.thumbnail) && (
                  <Image
                    src={entry.thumbnail}
                    alt=""
                    width={48}
                    height={48}
                    style={{
                      borderRadius: 'var(--mantine-radius-sm)',
                      objectFit: 'cover',
                      flexShrink: 0
                    }}
                  />
                )}
                <Stack gap={2} style={{minWidth: 0}}>
                  <Text size="xs" c="dimmed">
                    {entry.subredditPrefixed} &bull;{' '}
                    <TimeAgo timestamp={entry.visitedAt} />
                  </Text>
                  <Text size="sm" fw={500} lineClamp={2}>
                    {entry.title}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {formatNumber(entry.score)} upvotes &bull;{' '}
                    {formatNumber(entry.numComments)} comments
                  </Text>
                </Stack>
              </Group>
            </Anchor>
          ))}
        </Stack>
      </Card>
    </aside>
  )
}
