import type {NestedCommentData} from '@/lib/utils/formatting/commentFilters'
import {Anchor, Button, Center, Stack} from '@mantine/core'
import {CommentErrorBoundary} from '../CommentErrorBoundary/CommentErrorBoundary'
import {CommentItem} from '../CommentItem/CommentItem'

/**
 * Props for the CommentsList component.
 */
interface CommentsListProps {
  /** Array of nested comment data to render */
  comments: NestedCommentData[]
  /** Whether infinite loading is enabled for fetching more comments */
  enableInfiniteLoading: boolean
  /** Maximum depth to render nested comments */
  maxCommentDepth: number
  /** Whether there are more comments available to load */
  currentHasNextPage: boolean
  /** Whether currently fetching the next page of comments */
  currentIsFetchingNextPage: boolean
  /** Function to fetch the next page of comments */
  currentFetchNextPage: () => void
  /** Permalink to the full Reddit post for external viewing */
  postLink: string
}

/**
 * Renders a list of comments with error boundaries, infinite loading support,
 * and a link to view all comments on Reddit.
 *
 * Each comment is wrapped in an error boundary to prevent rendering failures
 * from breaking the entire comment section. Supports optional infinite loading
 * with a "Load More Comments" button when more comments are available.
 *
 * Features:
 * - Error boundaries around each comment for resilience
 * - Infinite scroll "Load More" button when enabled
 * - Direct link to view all comments on Reddit
 * - Accessible aria-labels for screen readers
 * - Responsive layout with Mantine Stack
 *
 * @param {CommentsListProps} props - Component props
 */
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
      aria-label={`Comments for post (${commentsCount} comments)`}
      component="section"
      gap="md"
      mb="sm"
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
            aria-label={
              currentIsFetchingNextPage
                ? 'Loading more comments...'
                : 'Load more comments'
            }
            loading={currentIsFetchingNextPage}
            onClick={() => currentFetchNextPage()}
            variant="subtle"
          >
            Load More Comments
          </Button>
        </Center>
      )}

      <Anchor
        aria-label="See all comments on Reddit (opens in new tab)"
        data-umami-event="view all comments on reddit"
        href={postLink}
        rel="noopener noreferrer"
        ta="center"
        target="_blank"
        underline="always"
        style={{
          textDecoration: 'underline !important'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.textDecoration = 'none !important'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.textDecoration = 'underline !important'
        }}
      >
        See all comments on Reddit
      </Anchor>
    </Stack>
  )
}
