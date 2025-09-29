'use client'

import {
  useGetPostCommentsPagesInfiniteQuery,
  useGetPostCommentsPagesRawInfiniteQuery,
  useLazyGetPostCommentsQuery,
  useLazyGetPostCommentsRawQuery,
  type AutoCommentData
} from '@/lib/store/services/commentsApi'
import {
  extractAndFilterComments,
  extractNestedComments,
  type NestedCommentData
} from '@/lib/utils/commentFilters'
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
import {CommentItem} from './CommentItem'

interface CommentsProps {
  permalink: string
  postLink: string
  open: boolean
  comments?: AutoCommentData[]
  enableInfiniteLoading?: boolean
  enableNestedComments?: boolean
  maxCommentDepth?: number
}

export function Comments({
  permalink,
  postLink,
  open,
  comments: providedComments,
  enableInfiniteLoading = false,
  enableNestedComments = false,
  maxCommentDepth = 4
}: Readonly<CommentsProps>) {
  // Hooks for flat comments (legacy)
  const [fetchComments, {data: fetchedComments, isLoading}] =
    useLazyGetPostCommentsQuery()

  // Hooks for raw comments (nested)
  const [
    fetchCommentsRaw,
    {data: fetchedCommentsRaw, isLoading: isLoadingRaw}
  ] = useLazyGetPostCommentsRawQuery()

  // Use infinite query for flat comments
  const {
    data: infiniteData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isInfiniteLoading
  } = useGetPostCommentsPagesInfiniteQuery(permalink, {
    skip: !enableInfiniteLoading || !open || enableNestedComments
  })

  // Use infinite query for raw comments (nested)
  const {
    data: infiniteDataRaw,
    fetchNextPage: fetchNextPageRaw,
    hasNextPage: hasNextPageRaw,
    isFetchingNextPage: isFetchingNextPageRaw,
    isLoading: isInfiniteLoadingRaw
  } = useGetPostCommentsPagesRawInfiniteQuery(permalink, {
    skip: !enableInfiniteLoading || !open || !enableNestedComments
  })

  // Combine all pages of infinite comments into a single array (flat)
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

  // Process nested comments when enabled
  const nestedComments = useMemo((): NestedCommentData[] => {
    if (!enableNestedComments) return []

    // Determine which raw response to use
    if (providedComments) {
      // Recursively preserve any existing hierarchy in providedComments
      function mapToNested(comment: any, depth = 0): NestedCommentData {
        const hasReplies =
          Array.isArray(comment.replies) && comment.replies.length > 0
        return {
          ...comment,
          depth: comment.depth ?? depth,
          hasReplies,
          replies: hasReplies
            ? comment.replies.map((reply: any) =>
                mapToNested(reply, (comment.depth ?? depth) + 1)
              )
            : undefined
        }
      }
      return providedComments.map((comment) =>
        mapToNested(comment)
      ) as NestedCommentData[]
    }

    if (enableInfiniteLoading && infiniteDataRaw?.pages?.length) {
      // Use infinite raw data - combine all pages
      const allNestedComments: NestedCommentData[] = []

      infiniteDataRaw.pages.forEach((page) => {
        const commentsListing = Array.isArray(page) ? page[1] : page
        const children = commentsListing?.data?.children ?? []
        const pageNestedComments = extractNestedComments(children)
        allNestedComments.push(...pageNestedComments)
      })

      return allNestedComments
    }

    if (!enableInfiniteLoading && fetchedCommentsRaw) {
      // Use single request raw data
      const commentsListing = Array.isArray(fetchedCommentsRaw)
        ? fetchedCommentsRaw[1]
        : fetchedCommentsRaw
      const children = commentsListing?.data?.children ?? []
      return extractNestedComments(children)
    }

    return []
  }, [
    providedComments,
    infiniteDataRaw,
    fetchedCommentsRaw,
    enableNestedComments,
    enableInfiniteLoading
  ])

  // Determine which comments to show and loading state
  const comments =
    providedComments ||
    (enableInfiniteLoading ? infiniteComments : fetchedComments)

  const showLoading = enableNestedComments
    ? enableInfiniteLoading
      ? isInfiniteLoadingRaw
      : isLoadingRaw
    : enableInfiniteLoading
      ? isInfiniteLoading
      : isLoading

  const currentFetchNextPage = enableNestedComments
    ? fetchNextPageRaw
    : fetchNextPage
  const currentHasNextPage = enableNestedComments ? hasNextPageRaw : hasNextPage
  const currentIsFetchingNextPage = enableNestedComments
    ? isFetchingNextPageRaw
    : isFetchingNextPage

  useEffect(() => {
    if (open && !providedComments && !enableInfiniteLoading) {
      if (enableNestedComments && !fetchedCommentsRaw && !isLoadingRaw) {
        // Fetch raw comments for nested rendering
        void fetchCommentsRaw(permalink)
      } else if (!enableNestedComments && !fetchedComments && !isLoading) {
        // Fetch processed flat comments
        void fetchComments(permalink)
      }
    }
  }, [
    open,
    providedComments,
    enableInfiniteLoading,
    enableNestedComments,
    fetchedComments,
    fetchedCommentsRaw,
    isLoading,
    isLoadingRaw,
    fetchComments,
    fetchCommentsRaw,
    permalink
  ])

  if (showLoading) {
    return (
      <Center>
        <Loader />
      </Center>
    )
  }

  // Determine which comments to render based on nested vs flat mode
  const hasCommentsToShow = enableNestedComments
    ? nestedComments.length > 0
    : comments?.length

  if (hasCommentsToShow) {
    return (
      <section className={classes.comments}>
        {enableNestedComments
          ? // Render nested comments with CommentItem
            nestedComments
              .filter((comment) => comment.id || comment.permalink)
              .map((comment) => (
                <CommentItem
                  key={comment.id || comment.permalink}
                  comment={comment}
                  maxDepth={maxCommentDepth}
                />
              ))
          : // Render flat comments (original implementation)
            comments!
              .filter(
                (c: AutoCommentData) => (c as any).id || (c as any).permalink
              )
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
                          <NumberFormatter
                            value={comment.ups}
                            thousandSeparator
                          />
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
        {enableInfiniteLoading && currentHasNextPage && (
          <Center pt="md">
            <Button
              variant="subtle"
              loading={currentIsFetchingNextPage}
              onClick={() => currentFetchNextPage()}
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
