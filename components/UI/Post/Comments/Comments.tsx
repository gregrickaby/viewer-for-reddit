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
import type {NestedCommentData} from '@/lib/utils/formatting/commentFilters'
import {
  collectAllCommentIds,
  sortComments
} from '@/lib/utils/formatting/commentHelpers'
import {VisuallyHidden} from '@mantine/core'
import {useHotkeys} from '@mantine/hooks'
import {CommentsEmpty} from './CommentsEmpty/CommentsEmpty'
import {CommentsList} from './CommentsList/CommentsList'
import {CommentsLoading} from './CommentsLoading/CommentsLoading'
import {CommentSortControls} from './CommentSortControls/CommentSortControls'

interface CommentsProps {
  permalink: string
  postLink: string
  open: boolean
  comments?: AutoCommentData[]
  enableInfiniteLoading?: boolean
  maxCommentDepth?: number
  showSortControls?: boolean
}

export function Comments({
  permalink,
  postLink,
  open,
  comments: providedComments,
  enableInfiniteLoading = false,
  maxCommentDepth = COMMENT_CONFIG.MAX_DEPTH,
  showSortControls = false
}: Readonly<CommentsProps>) {
  const commentSort = useAppSelector((state) => state.settings.commentSort)

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

  const sortedNestedComments = Array.isArray(nestedComments)
    ? sortComments(nestedComments, commentSort)
    : nestedComments

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
    return <CommentsEmpty />
  }

  return (
    <CommentsWithKeyboard
      sortedNestedComments={sortedNestedComments}
      enableInfiniteLoading={enableInfiniteLoading}
      maxCommentDepth={maxCommentDepth}
      currentHasNextPage={currentHasNextPage}
      currentIsFetchingNextPage={currentIsFetchingNextPage}
      currentFetchNextPage={currentFetchNextPage}
      postLink={postLink}
      showSortControls={showSortControls}
    />
  )
}

interface CommentsWithKeyboardProps {
  sortedNestedComments: NestedCommentData[]
  enableInfiniteLoading: boolean
  maxCommentDepth: number
  currentHasNextPage: boolean
  currentIsFetchingNextPage: boolean
  currentFetchNextPage: () => void
  postLink: string
  showSortControls: boolean
}

function CommentsWithKeyboard({
  sortedNestedComments,
  enableInfiniteLoading,
  maxCommentDepth,
  currentHasNextPage,
  currentIsFetchingNextPage,
  currentFetchNextPage,
  postLink,
  showSortControls
}: Readonly<CommentsWithKeyboardProps>) {
  const dispatch = useAppDispatch()

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

  return (
    <>
      {showSortControls && <CommentSortControls />}
      <VisuallyHidden
        component="output"
        aria-live="polite"
        aria-atomic="true"
        onTransitionEnd={clearAnnouncement}
      >
        {announcementText}
      </VisuallyHidden>
      <CommentsList
        comments={sortedNestedComments}
        enableInfiniteLoading={enableInfiniteLoading}
        maxCommentDepth={maxCommentDepth}
        currentHasNextPage={currentHasNextPage}
        currentIsFetchingNextPage={currentIsFetchingNextPage}
        currentFetchNextPage={currentFetchNextPage}
        postLink={postLink}
      />
    </>
  )
}
