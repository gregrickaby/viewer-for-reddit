'use client'

import {ErrorMessage} from '@/components/UI/ErrorMessage/ErrorMessage'
import {useCommentData} from '@/lib/hooks/useCommentData'
import {useAppSelector} from '@/lib/store/hooks'
import {COMMENT_CONFIG} from '@/lib/config'
import type {AutoCommentData} from '@/lib/store/services/commentsApi'
import type {NestedCommentData} from '@/lib/utils/formatting/commentFilters'
import {sortComments} from '@/lib/utils/formatting/commentHelpers'
import {useHotkeys} from '@mantine/hooks'
import {
  CommentExpansionProvider,
  useCommentExpansion
} from './CommentExpansionContext/CommentExpansionContext'
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
  enableNestedComments?: boolean
  maxCommentDepth?: number
  showSortControls?: boolean
}

export function Comments({
  permalink,
  postLink,
  open,
  comments: providedComments,
  enableInfiniteLoading = false,
  enableNestedComments = false,
  maxCommentDepth = COMMENT_CONFIG.MAX_DEPTH,
  showSortControls = false
}: Readonly<CommentsProps>) {
  const commentSort = useAppSelector((state) => state.settings.commentSort)

  const {
    displayComments,
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
    enableNestedComments
  })

  const sortedDisplayComments = Array.isArray(displayComments)
    ? sortComments<AutoCommentData | NestedCommentData>(
        displayComments,
        commentSort
      )
    : displayComments

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
    <CommentExpansionProvider>
      <CommentsWithKeyboard
        sortedDisplayComments={sortedDisplayComments}
        sortedNestedComments={sortedNestedComments}
        enableNestedComments={enableNestedComments}
        enableInfiniteLoading={enableInfiniteLoading}
        maxCommentDepth={maxCommentDepth}
        currentHasNextPage={currentHasNextPage}
        currentIsFetchingNextPage={currentIsFetchingNextPage}
        currentFetchNextPage={currentFetchNextPage}
        postLink={postLink}
        showSortControls={showSortControls}
      />
    </CommentExpansionProvider>
  )
}

interface CommentsWithKeyboardProps {
  sortedDisplayComments: AutoCommentData[] | NestedCommentData[]
  sortedNestedComments: NestedCommentData[]
  enableNestedComments: boolean
  enableInfiniteLoading: boolean
  maxCommentDepth: number
  currentHasNextPage: boolean
  currentIsFetchingNextPage: boolean
  currentFetchNextPage: () => void
  postLink: string
  showSortControls: boolean
}

function CommentsWithKeyboard({
  sortedDisplayComments,
  sortedNestedComments,
  enableNestedComments,
  enableInfiniteLoading,
  maxCommentDepth,
  currentHasNextPage,
  currentIsFetchingNextPage,
  currentFetchNextPage,
  postLink,
  showSortControls
}: Readonly<CommentsWithKeyboardProps>) {
  const {expandAllComments, collapseAllComments} = useCommentExpansion()

  // Keyboard shortcuts (RES-style)
  useHotkeys([
    [
      'o',
      () => {
        // Only expand if we have nested comments with reply structure
        if (
          enableNestedComments &&
          Array.isArray(sortedNestedComments) &&
          sortedNestedComments.length > 0
        ) {
          expandAllComments(sortedNestedComments)
        }
      }
    ],
    [
      'shift+o',
      () => {
        // Collapse all comments
        collapseAllComments()
      }
    ]
  ])

  return (
    <>
      {showSortControls && <CommentSortControls />}
      <CommentsList
        displayComments={sortedDisplayComments}
        nestedComments={sortedNestedComments}
        enableNestedComments={enableNestedComments}
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
