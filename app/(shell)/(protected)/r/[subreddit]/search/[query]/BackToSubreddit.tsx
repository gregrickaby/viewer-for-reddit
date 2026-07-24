'use client'

import {Anchor, Group} from '@mantine/core'
import {IconArrowLeft} from '@tabler/icons-react'
import Link from 'next/link'

/**
 * Back-to-subreddit link for the search results page.
 * Isolated as a Client Component so `next/link` crosses the
 * Server -> Client boundary once here, not on every render of the page.
 */
export function BackToSubreddit({
  subreddit
}: Readonly<{
  subreddit: string
}>) {
  return (
    <Anchor
      component={Link}
      href={`/r/${subreddit}`}
      td="none"
      c="dimmed"
      fz="sm"
    >
      <Group gap={4}>
        <IconArrowLeft size={14} />
        Back to r/{subreddit}
      </Group>
    </Anchor>
  )
}
