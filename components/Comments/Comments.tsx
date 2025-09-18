'use client'

import {useLazyGetPostCommentsQuery} from '@/lib/store/services/redditApi'
import type {CommentData} from '@/lib/types/comments'
import {formatTimeAgo} from '@/lib/utils/formatTimeAgo'
import {decodeAndSanitizeHtml} from '@/lib/utils/sanitizeText'
import {
  Anchor,
  Card,
  Center,
  Group,
  Loader,
  NumberFormatter,
  Text
} from '@mantine/core'
import {useEffect} from 'react'
import {BiSolidUpvote} from 'react-icons/bi'
import classes from './Comments.module.css'

interface CommentsProps {
  permalink: string
  postLink: string
  open: boolean
}

export function Comments({permalink, postLink, open}: Readonly<CommentsProps>) {
  const [fetchComments, {data: comments, isLoading}] =
    useLazyGetPostCommentsQuery()

  useEffect(() => {
    if (open && !comments && !isLoading) {
      void fetchComments(permalink)
    }
  }, [open, comments, isLoading, fetchComments, permalink])

  if (isLoading) {
    return (
      <Center>
        <Loader />
      </Center>
    )
  }

  if (comments?.length) {
    return (
      <section className={classes.comments}>
        {comments.map((c: CommentData, index) => (
          <Card
            key={c.id || c.permalink || index}
            component="article"
            padding="md"
            radius="md"
            shadow="none"
            withBorder
          >
            <Group gap="xs">
              <Anchor
                href={`https://reddit.com/user/${c.author}`}
                rel="noopener noreferrer"
                target="_blank"
              >
                <Text c="dimmed" size="sm">
                  {c.author}
                </Text>
              </Anchor>
              &middot;
              <Text c="dimmed" size="sm">
                {formatTimeAgo(c.created_utc ?? 0)}
              </Text>
            </Group>

            <div
              className={classes.commentBody}
              dangerouslySetInnerHTML={{
                __html: decodeAndSanitizeHtml(c.body_html ?? c.body ?? '')
              }}
            />

            <Group gap="md">
              <Group className={classes.meta}>
                <BiSolidUpvote size={16} color="red" />
                <Text size="sm" c="dimmed">
                  <NumberFormatter value={c.ups} thousandSeparator />
                </Text>
              </Group>
              <Anchor
                href={`https://reddit.com${c.permalink}`}
                rel="noopener noreferrer"
                target="_blank"
              >
                <Text size="sm" c="dimmed">
                  View on Reddit
                </Text>
              </Anchor>
            </Group>
          </Card>
        ))}

        <Anchor
          className={classes.readMoreLink}
          href={postLink}
          rel="noopener noreferrer"
          target="_blank"
          underline="always"
        >
          See all comments on Reddit
        </Anchor>
      </section>
    )
  }

  return (
    <Text size="sm" c="dimmed">
      No comments
    </Text>
  )
}
