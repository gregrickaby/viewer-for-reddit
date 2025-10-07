import type {AutoCommentData} from '@/lib/store/services/commentsApi'
import type {NestedCommentData} from '@/lib/utils/formatting/commentFilters'
import {hasRequiredCommentFields} from '@/lib/utils/formatting/commentHelpers'
import {Anchor, Button, Center} from '@mantine/core'
import {CommentCard} from '../CommentCard/CommentCard'
import {CommentErrorBoundary} from '../CommentErrorBoundary/CommentErrorBoundary'
import {CommentItem} from '../CommentItem/CommentItem'
import classes from './CommentsList.module.css'

interface CommentsListProps {
  displayComments: AutoCommentData[] | NestedCommentData[]
  nestedComments: NestedCommentData[]
  enableNestedComments: boolean
  enableInfiniteLoading: boolean
  maxCommentDepth: number
  currentHasNextPage: boolean
  currentIsFetchingNextPage: boolean
  currentFetchNextPage: () => void
  postLink: string
}

export function CommentsList({
  displayComments,
  nestedComments,
  enableNestedComments,
  enableInfiniteLoading,
  maxCommentDepth,
  currentHasNextPage,
  currentIsFetchingNextPage,
  currentFetchNextPage,
  postLink
}: Readonly<CommentsListProps>) {
  const commentsCount = enableNestedComments
    ? nestedComments.length
    : displayComments?.length || 0

  return (
    <section
      className={classes.comments}
      aria-label={`Comments for post (${commentsCount} comments)`}
    >
      {enableNestedComments
        ? // Render nested comments with CommentItem
          nestedComments
            .filter((comment) => comment.id || comment.permalink)
            .map((comment) => (
              <CommentErrorBoundary key={comment.id || comment.permalink}>
                <CommentItem comment={comment} maxDepth={maxCommentDepth} />
              </CommentErrorBoundary>
            ))
        : // Render flat comments with CommentCard
          (displayComments as AutoCommentData[])
            .filter((comment): comment is AutoCommentData =>
              hasRequiredCommentFields(comment)
            )
            .map((comment) => (
              <CommentErrorBoundary key={comment.id || comment.permalink}>
                <CommentCard comment={comment} />
              </CommentErrorBoundary>
            ))}

      {/* Load More button for infinite loading */}
      {enableInfiniteLoading && currentHasNextPage && (
        <Center pt="md">
          <Button
            variant="subtle"
            loading={currentIsFetchingNextPage}
            onClick={() => currentFetchNextPage()}
            aria-label={
              currentIsFetchingNextPage
                ? 'Loading more comments...'
                : 'Load more comments'
            }
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
        aria-label="See all comments on Reddit (opens in new tab)"
      >
        See all comments on Reddit
      </Anchor>
    </section>
  )
}
