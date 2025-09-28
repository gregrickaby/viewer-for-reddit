'use client'

import {
  useGetPostCommentsPagesInfiniteQuery,
  useLazyGetPostCommentsQuery,
  type AutoCommentData
} from '@/lib/store/services/redditApi'
import {extractAndFilterComments} from '@/lib/utils/commentFilters'
import {formatTimeAgo} from '@/lib/utils/formatTimeAgo'
import {decodeAndSanitizeHtml} from '@/lib/utils/sanitizeText'
import {
  Anchor,
  Button,
  Card,
  Center,
  Group,
  Loader,
  NumberFormatter,
  Text
} from '@mantine/core'
import {useEffect, useMemo} from 'react'
import {BiSolidUpvote} from 'react-icons/bi'
import classes from './Comments.module.css'

interface CommentsProps {
  permalink: string
  postLink: string
  open: boolean
  comments?: AutoCommentData[]
  enableInfiniteLoading?: boolean
}

export function Comments({
  permalink,
  postLink,
  open,
  comments: providedComments,
  enableInfiniteLoading = false
}: Readonly<CommentsProps>) {
  const [fetchComments, {data: fetchedComments, isLoading}] =
    useLazyGetPostCommentsQuery()

  // Use infinite query only when explicitly enabled
  const {
    data: infiniteData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isInfiniteLoading
  } = useGetPostCommentsPagesInfiniteQuery(permalink, {
    skip: !enableInfiniteLoading || !open
  })

  // Combine all pages of infinite comments into a single array
  const infiniteComments = useMemo(() => {
    if (!infiniteData?.pages?.length) return []

    const allComments: AutoCommentData[] = []

    // Process each page of comments
    infiniteData.pages.forEach((page) => {
      // Extract comments from the response (Reddit returns [post, comments])
      const commentsListing = Array.isArray(page) ? page[1] : page
      const children = commentsListing?.data?.children ?? []
      const pageComments = extractAndFilterComments(children)
      allComments.push(...pageComments)
    })

    return allComments
  }, [infiniteData])

  // Determine which comments to show and loading state
  const comments =
    providedComments ||
    (enableInfiniteLoading ? infiniteComments : fetchedComments)
  const showLoading = enableInfiniteLoading ? isInfiniteLoading : isLoading

  useEffect(() => {
    if (
      open &&
      !providedComments &&
      !enableInfiniteLoading &&
      !fetchedComments &&
      !isLoading
    ) {
      void fetchComments(permalink)
    }
  }, [
    open,
    providedComments,
    enableInfiniteLoading,
    fetchedComments,
    isLoading,
    fetchComments,
    permalink
  ])

  if (showLoading) {
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

        {/* Load More button for infinite loading */}
        {enableInfiniteLoading && hasNextPage && (
          <Center pt="md">
            <Button
              variant="subtle"
              loading={isFetchingNextPage}
              onClick={() => fetchNextPage()}
            >
              Load More Comments
            </Button>
          </Center>
        )}

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
