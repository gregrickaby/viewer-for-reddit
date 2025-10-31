import type {NestedCommentData} from '@/lib/utils/formatting/commentFilters'
import {Anchor, Button, Center, Stack} from '@mantine/core'
import {CommentErrorBoundary} from '../CommentErrorBoundary/CommentErrorBoundary'
import {CommentItem} from '../CommentItem/CommentItem'

interface CommentsListProps {
  comments: NestedCommentData[]
  enableInfiniteLoading: boolean
  maxCommentDepth: number
  currentHasNextPage: boolean
  currentIsFetchingNextPage: boolean
  currentFetchNextPage: () => void
  postLink: string
}

export function CommentsList({
  comments,
  enableInfiniteLoading,
  maxCommentDepth,
  currentHasNextPage,
  currentIsFetchingNextPage,
  currentFetchNextPage,
  postLink
}: Readonly<CommentsListProps>) {
  const commentsCount = comments.length

  return (
    <Stack
      component="section"
      gap="md"
      mb="sm"
      aria-label={`Comments for post (${commentsCount} comments)`}
    >
      {comments
        .filter((comment) => comment.id || comment.permalink)
        .map((comment) => (
          <CommentErrorBoundary key={comment.id || comment.permalink}>
            <CommentItem comment={comment} maxDepth={maxCommentDepth} />
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
        href={postLink}
        rel="noopener noreferrer"
        target="_blank"
        underline="always"
        ta="center"
        style={{
          textDecoration: 'underline !important'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.textDecoration = 'none !important'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.textDecoration = 'underline !important'
        }}
        aria-label="See all comments on Reddit (opens in new tab)"
      >
        See all comments on Reddit
      </Anchor>
    </Stack>
  )
}
