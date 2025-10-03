'use client'

import {ErrorMessage} from '@/components/ErrorMessage/ErrorMessage'
import {useCommentData} from '@/lib/hooks/useCommentData'
import type {AutoCommentData} from '@/lib/store/services/commentsApi'
import {CommentExpansionProvider} from './CommentExpansionContext/CommentExpansionContext'
import {CommentsEmpty} from './CommentsEmpty/CommentsEmpty'
import {CommentsList} from './CommentsList/CommentsList'
import {CommentsLoading} from './CommentsLoading/CommentsLoading'

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
      <CommentsList
        displayComments={displayComments}
        nestedComments={nestedComments}
        enableNestedComments={enableNestedComments}
        enableInfiniteLoading={enableInfiniteLoading}
        maxCommentDepth={maxCommentDepth}
        currentHasNextPage={currentHasNextPage}
        currentIsFetchingNextPage={currentIsFetchingNextPage}
        currentFetchNextPage={currentFetchNextPage}
        postLink={postLink}
      />
    </CommentExpansionProvider>
  )
}
