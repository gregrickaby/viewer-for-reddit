'use client'

import {useLazyGetPostCommentsQuery} from '@/lib/store/services/redditApi'
import {formatTimeAgo} from '@/lib/utils/formatTimeAgo'
import {decodeAndSanitizeHtml, sanitizeText} from '@/lib/utils/sanitizeText'
import {Anchor, Text} from '@mantine/core'
import {useEffect} from 'react'
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
      <Text size="sm" c="dimmed">
        Loading comments...
      </Text>
    )
  }

  if (comments?.length) {
    return (
      <section className={classes.comments}>
        {comments.map((c: any) => (
          <article key={c.id} className={classes.comment}>
            <Text size="sm" c="dimmed">
              <strong>{c.author}</strong>
              {' • '}
              posted {formatTimeAgo(c.created_utc)}
            </Text>
            {c.body_html ? (
              <div
                className={classes.commentBody}
                dangerouslySetInnerHTML={{
                  __html: decodeAndSanitizeHtml(c.body_html)
                }}
              />
            ) : (
              <Text size="sm">{sanitizeText(c.body ?? '')}</Text>
            )}
          </article>
        ))}

        <Anchor
          className={classes.link}
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
