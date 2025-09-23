'use client'

import {Comments} from '@/components/Comments/Comments'
import {
  useLazyGetPostCommentsQuery,
  type AutoCommentData
} from '@/lib/store/services/redditApi'
import {Anchor, Center, Loader, Text} from '@mantine/core'
import {useEffect} from 'react'
import classes from './PostComments.module.css'

interface PostCommentsProps {
  permalink: string
  postLink: string
  open: boolean
}

export function PostComments({
  permalink,
  postLink,
  open
}: Readonly<PostCommentsProps>) {
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
        {comments
          .filter((comment: AutoCommentData) => comment.id && comment.permalink)
          .map((comment: AutoCommentData) => (
            <Comments
              key={comment.id}
              comment={comment}
              showContext={false}
              showScore
            />
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
