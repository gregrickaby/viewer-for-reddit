'use client'

import {
  useLazyGetPostCommentsQuery,
  type AutoCommentData
} from '@/lib/store/services/redditApi'
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
  comments?: AutoCommentData[]
}

export function Comments({
  permalink,
  postLink,
  open,
  comments: providedComments
}: Readonly<CommentsProps>) {
  const [fetchComments, {data: fetchedComments, isLoading}] =
    useLazyGetPostCommentsQuery()

  const comments = providedComments || fetchedComments

  useEffect(() => {
    if (open && !providedComments && !fetchedComments && !isLoading) {
      void fetchComments(permalink)
    }
  }, [
    open,
    providedComments,
    fetchedComments,
    isLoading,
    fetchComments,
    permalink
  ])

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
        {comments
          .filter((c: AutoCommentData) => (c as any).id || (c as any).permalink)
          .map((c: AutoCommentData) => {
            const comment = c as any
            return (
              <Card
                key={comment.id || comment.permalink}
                component="article"
                padding="md"
                radius="md"
                shadow="none"
                withBorder
              >
                <Group gap="xs">
                  <Anchor
                    href={`https://reddit.com/user/${comment.author}`}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    <Text c="dimmed" size="sm">
                      {comment.author}
                    </Text>
                  </Anchor>
                  &middot;
                  <Text c="dimmed" size="sm">
                    {formatTimeAgo(comment.created_utc ?? 0)}
                  </Text>
                </Group>

                <div
                  className={classes.commentBody}
                  dangerouslySetInnerHTML={{
                    __html: decodeAndSanitizeHtml(
                      comment.body_html ?? comment.body ?? ''
                    )
                  }}
                />

                <Group gap="md">
                  <Group className={classes.meta}>
                    <BiSolidUpvote size={16} color="red" />
                    <Text size="sm" c="dimmed">
                      <NumberFormatter value={comment.ups} thousandSeparator />
                    </Text>
                  </Group>
                  <Anchor
                    href={`https://reddit.com${comment.permalink}`}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    <Text size="sm" c="dimmed">
                      View on Reddit
                    </Text>
                  </Anchor>
                </Group>
              </Card>
            )
          })}

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
