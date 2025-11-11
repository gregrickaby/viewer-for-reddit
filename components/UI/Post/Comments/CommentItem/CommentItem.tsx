'use client'

import {CommentContent} from '@/components/UI/Post/Comments/CommentContent/CommentContent'
import {CommentDeleteModal} from '@/components/UI/Post/Comments/CommentDeleteModal/CommentDeleteModal'
import {CommentMetadata} from '@/components/UI/Post/Comments/CommentMetadata/CommentMetadata'
import {CommentReplies} from '@/components/UI/Post/Comments/CommentReplies/CommentReplies'
import {CommentReplyForm} from '@/components/UI/Post/Comments/CommentReplyForm/CommentReplyForm'
import {COMMENT_CONFIG} from '@/lib/config'
import {useCommentActions} from '@/lib/hooks/comments/interaction/useCommentActions/useCommentActions'
import {useCommentFocusManagement} from '@/lib/hooks/comments/navigation/useCommentFocusManagement/useCommentFocusManagement'
import {useCommentState} from '@/lib/hooks/comments/state/useCommentState/useCommentState'
import type {NestedCommentData} from '@/lib/utils/formatting/comments/commentFilters'
import {Box, Button, Card, Group, Stack, Text} from '@mantine/core'
import {BiComment} from 'react-icons/bi'
import {MdDelete} from 'react-icons/md'
import classes from './CommentItem.module.css'

/**
 * Props for the CommentItem component.
 */
interface CommentItemProps {
  /** The nested comment data to render */
  comment: NestedCommentData
  /** Maximum depth for nested comment threads (default from config) */
  maxDepth?: number
}

/**
 * Renders a single comment item with nested replies and voting.
 *
 * Features:
 * - Nested comment threading with visual indentation (always expanded)
 * - Vote buttons integrated via CommentMetadata
 * - Sanitized HTML rendering for comment body
 * - Inline media support (images/videos)
 * - Depth limit handling with informative message
 * - Thread lines for visual hierarchy
 * - Keyboard navigation support (via parent Comments component)
 *
 * @param {CommentItemProps} props - Component props
 * @returns JSX.Element rendered comment with all features
 */
export function CommentItem({
  comment,
  maxDepth = COMMENT_CONFIG.MAX_DEPTH
}: Readonly<CommentItemProps>) {
  const commentId = comment.id || comment.permalink || ''

  // State management
  const {
    isAuthenticated,
    currentUsername,
    showReplyForm,
    replyText,
    errorMessage,
    deleteError,
    isDeleted,
    deleteModalOpened,
    setReplyText,
    setErrorMessage,
    setShowReplyForm,
    setDeleteError,
    setIsDeleted,
    openDeleteModal,
    closeDeleteModal
  } = useCommentState()

  // Focus management
  const {textareaRef, replyButtonRef, deleteButtonRef} =
    useCommentFocusManagement({showReplyForm})

  // Action handlers
  const {
    toggleReplyForm,
    handleSubmit,
    handleCancel,
    handleDeleteConfirm,
    handleDeleteCancel,
    isSubmitting,
    isDeleting
  } = useCommentActions({
    commentName: comment.name || '',
    replyText,
    setReplyText,
    setErrorMessage,
    setShowReplyForm,
    setDeleteError,
    setIsDeleted,
    closeDeleteModal,
    replyButtonRef,
    deleteButtonRef
  })

  const hasReplies = comment.replies && comment.replies.length > 0
  const showReplies = hasReplies && (comment.depth ?? 0) < maxDepth
  const canReply =
    isAuthenticated && (comment.depth ?? 0) < maxDepth && !isDeleted
  const isOwnComment =
    isAuthenticated && currentUsername === comment.author && !isDeleted

  return (
    <Box
      className={classes.commentItem}
      data-comment-depth={comment.depth ?? 0}
      data-comment-id={commentId}
      data-testid={`comment-item-depth-${comment.depth ?? 0}`}
      style={
        {
          '--comment-depth': comment.depth ?? 0
        } as React.CSSProperties
      }
      tabIndex={-1}
    >
      {(comment.depth ?? 0) > 0 && (
        <div className={classes.threadLine} data-testid="thread-line" />
      )}

      <div
        className={`${classes.commentContent} ${(comment.depth ?? 0) > 0 ? classes.nestedComment : ''}`}
      >
        <Card component="article" padding="md" radius="md" shadow="none">
          <Stack gap="xs">
            <CommentContent comment={comment} isDeleted={isDeleted} />

            <CommentMetadata
              comment={comment}
              hasReplies={hasReplies}
              showReplies={!!showReplies}
            />

            {canReply && (
              <Box mt="xs">
                <Group gap="xs">
                  <Button
                    aria-label="Reply to this comment"
                    data-umami-event="reply comment button"
                    leftSection={<BiComment size={14} />}
                    onClick={toggleReplyForm}
                    ref={replyButtonRef}
                    size="xs"
                    variant="subtle"
                  >
                    Reply
                  </Button>

                  {isOwnComment && (
                    <Button
                      aria-label="Delete this comment"
                      color="red"
                      data-umami-event="delete own comment button"
                      disabled={isDeleting}
                      leftSection={<MdDelete size={14} />}
                      loading={isDeleting}
                      onClick={openDeleteModal}
                      ref={deleteButtonRef}
                      size="xs"
                      variant="subtle"
                    >
                      Delete
                    </Button>
                  )}
                </Group>

                {deleteError && (
                  <Text c="red" mt="xs" role="alert" size="sm">
                    {deleteError}
                  </Text>
                )}

                <CommentReplyForm
                  errorMessage={errorMessage}
                  isSubmitting={isSubmitting}
                  onCancel={handleCancel}
                  onReplyTextChange={setReplyText}
                  onSubmit={handleSubmit}
                  replyText={replyText}
                  showReplyForm={showReplyForm}
                  textareaRef={textareaRef}
                />
              </Box>
            )}
          </Stack>
        </Card>

        <CommentReplies comment={comment} maxDepth={maxDepth} />
      </div>

      <CommentDeleteModal
        onCancel={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        opened={deleteModalOpened}
      />
    </Box>
  )
}
