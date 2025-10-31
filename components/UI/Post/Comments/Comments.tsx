'use client'

import {ErrorMessage} from '@/components/UI/ErrorMessage/ErrorMessage'
import {COMMENT_CONFIG} from '@/lib/config'
import {useCommentData} from '@/lib/hooks/useCommentData'
import {useCommentNavigation} from '@/lib/hooks/useCommentNavigation'
import {
  collapseAllComments,
  expandAllComments
} from '@/lib/store/features/commentExpansionSlice'
import {useAppDispatch, useAppSelector} from '@/lib/store/hooks'
import type {AutoCommentData} from '@/lib/store/services/commentsApi'
import {
  collectAllCommentIds,
  sortComments
} from '@/lib/utils/formatting/commentHelpers'
import {scrollToComments} from '@/lib/utils/routing/scrollToComments'
import {VisuallyHidden} from '@mantine/core'
import {useHotkeys} from '@mantine/hooks'
import {useEffect, useRef} from 'react'
import {CommentForm} from './CommentForm/CommentForm'
import {CommentsEmpty} from './CommentsEmpty/CommentsEmpty'
import {CommentsList} from './CommentsList/CommentsList'
import {CommentsLoading} from './CommentsLoading/CommentsLoading'
import {CommentSortControls} from './CommentSortControls/CommentSortControls'

/**
 * Props for the Comments component
 */
interface CommentsProps {
  /** URL path for fetching comments */
  permalink: string
  /** Link back to the post */
  postLink: string
  /** Whether comments section is open/visible */
  open: boolean
  /** Post ID for top-level commenting (e.g., t3_abc123) */
  postId?: string
  /** Pre-loaded comments data (optional) */
  comments?: AutoCommentData[]
  /** Enable infinite scroll to load more comments */
  enableInfiniteLoading?: boolean
  /** Maximum depth for nested comment threads */
  maxCommentDepth?: number
  /** Show comment sort controls */
  showSortControls?: boolean
}

/**
 * Comments component
 *
 * Main container for rendering nested comment threads. Handles data fetching,
 * sorting, loading states, and keyboard navigation (J/K/U for navigation,
 * O/Shift+O for expand/collapse all). Displays errors and empty states gracefully.
 *
 * @param {CommentsProps} props - Component props
 */
export function Comments({
  permalink,
  postLink,
  open,
  postId,
  comments: providedComments,
  enableInfiniteLoading = false,
  maxCommentDepth = COMMENT_CONFIG.MAX_DEPTH,
  showSortControls = false
}: Readonly<CommentsProps>) {
  const dispatch = useAppDispatch()
  const commentSort = useAppSelector((state) => state.settings.commentSort)
  const hasScrolledRef = useRef(false)

  const {
    nestedComments,
    showLoading,
    hasCommentsToShow,
    currentFetchNextPage,
    currentHasNextPage,
    currentIsFetchingNextPage,
    isError,
    error
  } = useCommentData({
    permalink,
    open,
    comments: providedComments,
    enableInfiniteLoading,
    enableNestedComments: true
  })

  // Reset hasScrolledRef when permalink changes
  useEffect(() => {
    hasScrolledRef.current = false
  }, [permalink])

  const sortedNestedComments = Array.isArray(nestedComments)
    ? sortComments(nestedComments, commentSort)
    : nestedComments

  // J/K/U navigation (RES-style)
  const {announcementText, clearAnnouncement} = useCommentNavigation({
    enabled: true,
    announceNavigation: true
  })

  // O/Shift+O expand/collapse shortcuts
  useHotkeys([
    [
      'o',
      () => {
        // Expand all comments
        if (
          Array.isArray(sortedNestedComments) &&
          sortedNestedComments.length > 0
        ) {
          const commentIds = collectAllCommentIds(sortedNestedComments)
          dispatch(expandAllComments(commentIds))
        }
      }
    ],
    [
      'shift+o',
      () => {
        // Collapse all comments
        dispatch(collapseAllComments())
      }
    ]
  ])

  // Scroll to comments section if hash is present
  useEffect(() => {
    if (open && !showLoading && !hasScrolledRef.current) {
      const didScroll = scrollToComments()
      if (didScroll) {
        hasScrolledRef.current = true
      }
    }
  }, [open, showLoading])

  if (showLoading) {
    return <CommentsLoading />
  }

  if (isError) {
    return (
      <ErrorMessage
        error={error}
        type="post"
        resourceName="comments"
        fallbackUrl={postLink}
        compact
      />
    )
  }

  if (!hasCommentsToShow) {
    return <CommentsEmpty postId={postId} />
  }

  return (
    <div id="comments">
      {showSortControls && <CommentSortControls />}
      {postId && <CommentForm thingId={postId} />}
      <VisuallyHidden
        aria-atomic="true"
        aria-live="polite"
        component="output"
        onTransitionEnd={clearAnnouncement}
      >
        {announcementText}
      </VisuallyHidden>
      <CommentsList
        comments={sortedNestedComments}
        currentFetchNextPage={currentFetchNextPage}
        currentHasNextPage={currentHasNextPage}
        currentIsFetchingNextPage={currentIsFetchingNextPage}
        enableInfiniteLoading={enableInfiniteLoading}
        maxCommentDepth={maxCommentDepth}
        postLink={postLink}
      />
    </div>
  )
}
