'use client'

import {CommentAuthor} from '@/components/UI/Post/Comments/CommentAuthor/CommentAuthor'
import {CommentMedia} from '@/components/UI/Post/Comments/CommentMedia/CommentMedia'
import {CommentMetadata} from '@/components/UI/Post/Comments/CommentMetadata/CommentMetadata'
import {COMMENT_CONFIG} from '@/lib/config'
import {
  collapseComment,
  collapseSubtree,
  expandComment,
  expandSubtree,
  selectIsCommentExpanded,
  selectIsSubtreeExpanded
} from '@/lib/store/features/commentExpansionSlice'
import {useAppDispatch, useAppSelector} from '@/lib/store/hooks'
import {
  useDeleteCommentMutation,
  useSubmitCommentMutation
} from '@/lib/store/services/commentsApi'
import type {NestedCommentData} from '@/lib/utils/formatting/commentFilters'
import {collectDescendantIds} from '@/lib/utils/formatting/commentHelpers'
import {stripMediaLinks} from '@/lib/utils/formatting/commentMediaHelpers'
import {formatTimeAgo} from '@/lib/utils/formatting/formatTimeAgo'
import {decodeAndSanitizeHtml} from '@/lib/utils/validation/sanitizeText'
import {
  Box,
  Button,
  Card,
  Collapse,
  Group,
  Modal,
  Stack,
  Text,
  Textarea
} from '@mantine/core'
import {useDisclosure} from '@mantine/hooks'
import {notifications} from '@mantine/notifications'
import {useEffect, useRef, useState} from 'react'
import {BiCheckCircle, BiComment} from 'react-icons/bi'
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
 * Renders a single comment item with nested replies, voting, and expansion controls.
 *
 * Features:
 * - Nested comment threading with visual indentation
 * - Expand/collapse individual replies or entire subtrees
 * - Vote buttons integrated via CommentMetadata
 * - Sanitized HTML rendering for comment body
 * - Inline media support (images/videos)
 * - Collapsed preview showing reply count and snippet
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
  const dispatch = useAppDispatch()
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const replyButtonRef = useRef<HTMLButtonElement>(null)
  const deleteButtonRef = useRef<HTMLButtonElement>(null)

  const commentId = comment.id || comment.permalink || ''
  const isExpanded = useAppSelector((state) =>
    selectIsCommentExpanded(state, commentId, comment.depth)
  )
  const isSubtreeFullyExpanded = useAppSelector((state) =>
    selectIsSubtreeExpanded(state, commentId)
  )
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated)
  const currentUsername = useAppSelector((state) => state.auth.username)

  // Reply form state
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [submitComment, {isLoading: isSubmitting}] = useSubmitCommentMutation()

  // Delete state
  const [deleteComment, {isLoading: isDeleting}] = useDeleteCommentMutation()
  const [deleteError, setDeleteError] = useState<string>('')
  const [isDeleted, setIsDeleted] = useState(false)
  const [deleteModalOpened, {open: openDeleteModal, close: closeDeleteModal}] =
    useDisclosure(false)

  // Auto-focus textarea when reply form opens
  useEffect(() => {
    if (showReplyForm && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [showReplyForm])

  const toggleExpansion = () => {
    if (isExpanded) {
      dispatch(collapseComment(commentId))
    } else {
      dispatch(expandComment(commentId))
    }
  }

  const toggleSubtreeExpansion = () => {
    const descendantIds = collectDescendantIds(comment)
    if (isSubtreeFullyExpanded) {
      dispatch(collapseSubtree({id: commentId, descendantIds}))
    } else {
      dispatch(expandSubtree({id: commentId, descendantIds}))
    }
  }

  const toggleReplyForm = () => {
    setShowReplyForm(!showReplyForm)
    if (showReplyForm) {
      setReplyText('')
    }
  }

  const handleSubmit = async () => {
    if (!replyText.trim() || !comment.name) return

    try {
      setErrorMessage('')
      await submitComment({
        thing_id: comment.name,
        text: replyText
      }).unwrap()

      // Show success message
      notifications.show({
        message:
          'Comment posted successfully! It may take a few moments before Reddit shows your comment.',
        color: 'green',
        icon: <BiCheckCircle size={20} />
      })

      // Success: close form and clear text
      setShowReplyForm(false)
      setReplyText('')
    } catch (err) {
      // Extract error message from RTK Query error
      if (err && typeof err === 'object' && 'data' in err) {
        const errorData = err.data as {message?: string; error?: string}
        setErrorMessage(
          errorData.message ||
            errorData.error ||
            'Failed to submit comment. Please try again.'
        )
      } else {
        setErrorMessage('Failed to submit comment. Please try again.')
      }
    }
  }

  const handleCancel = () => {
    setShowReplyForm(false)
    setReplyText('')
    setErrorMessage('')

    // Return focus to reply button after cancel
    setTimeout(() => {
      replyButtonRef.current?.focus()
    }, 0)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Cmd+Enter (Mac) or Ctrl+Enter (Windows/Linux)
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && !isSubmitting) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleDeleteClick = () => {
    openDeleteModal()
  }

  const handleDeleteConfirm = async () => {
    if (!comment.name) return

    try {
      setDeleteError('')
      await deleteComment({id: comment.name}).unwrap()

      // Mark as deleted locally
      setIsDeleted(true)

      // Close modal after successful deletion
      closeDeleteModal()
    } catch (err) {
      // Extract error message from RTK Query error
      if (err && typeof err === 'object' && 'data' in err) {
        const errorData = err.data as {message?: string; error?: string}
        setDeleteError(
          errorData.message ||
            errorData.error ||
            'Failed to delete comment. Please try again.'
        )
      } else {
        setDeleteError('Failed to delete comment. Please try again.')
      }

      // Close modal even if deletion fails
      closeDeleteModal()
    }
  }

  const handleDeleteCancel = () => {
    closeDeleteModal()
    // Return focus to delete button after cancel
    setTimeout(() => {
      deleteButtonRef.current?.focus()
    }, 0)
  }

  const hasReplies = comment.hasReplies && comment.replies?.length
  const showReplies = hasReplies && comment.depth < maxDepth

  // Can reply if authenticated and not at max depth and comment not deleted
  const canReply = isAuthenticated && comment.depth < maxDepth && !isDeleted

  // Can delete if authenticated, owns the comment, and not already deleted
  const isOwnComment =
    isAuthenticated && currentUsername === comment.author && !isDeleted

  return (
    <Box
      className={classes.commentItem}
      style={
        {
          '--comment-depth': comment.depth
        } as React.CSSProperties
      }
      data-testid={`comment-item-depth-${comment.depth}`}
      data-comment-id={commentId}
      data-comment-depth={comment.depth}
      tabIndex={-1}
    >
      {comment.depth > 0 && (
        <div className={classes.threadLine} data-testid="thread-line" />
      )}

      <div
        className={`${classes.commentContent} ${comment.depth > 0 ? classes.nestedComment : ''}`}
      >
        <Card component="article" padding="md" radius="md" shadow="none">
          <Stack gap="xs">
            <Group gap="xs" align="center">
              <CommentAuthor author={comment.author} />
              <Text c="dimmed" size="sm">
                &middot;
              </Text>
              <Text c="dimmed" size="xs">
                {formatTimeAgo(comment.created_utc ?? 0)}
              </Text>
              {isDeleted && (
                <>
                  <Text c="dimmed" size="sm">
                    &middot;
                  </Text>
                  <Text c="red" size="xs" fw={500}>
                    deleted
                  </Text>
                </>
              )}
            </Group>

            {isDeleted ? (
              <Text c="dimmed" fs="italic" size="sm">
                [deleted]
              </Text>
            ) : (
              <>
                <section
                  className={classes.commentBody}
                  dangerouslySetInnerHTML={{
                    __html: stripMediaLinks(
                      decodeAndSanitizeHtml(
                        comment.body_html ?? comment.body ?? ''
                      )
                    )
                  }}
                />

                <CommentMedia
                  bodyHtml={decodeAndSanitizeHtml(comment.body_html ?? '')}
                />
              </>
            )}

            <CommentMetadata
              comment={comment}
              hasReplies={hasReplies}
              isExpanded={isExpanded}
              isSubtreeFullyExpanded={isSubtreeFullyExpanded}
              showReplies={!!showReplies}
              toggleExpansion={toggleExpansion}
              toggleSubtreeExpansion={toggleSubtreeExpansion}
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
                      onClick={handleDeleteClick}
                      ref={deleteButtonRef}
                      size="xs"
                      variant="subtle"
                    >
                      Delete
                    </Button>
                  )}
                </Group>

                {deleteError && (
                  <Text c="red" size="sm" role="alert" mt="xs">
                    {deleteError}
                  </Text>
                )}

                <Collapse in={showReplyForm}>
                  <Stack gap="xs" mt="xs">
                    <Textarea
                      aria-busy={isSubmitting}
                      aria-label="Reply text. Press Ctrl+Enter or Cmd+Enter to submit."
                      autosize
                      disabled={isSubmitting}
                      maxLength={10000}
                      minRows={3}
                      onChange={(e) => setReplyText(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Write your reply (markdown supported)..."
                      ref={textareaRef}
                      value={replyText}
                    />

                    <Group gap="xs">
                      <Button
                        data-umami-event="submit reply comment"
                        disabled={!replyText.trim()}
                        loading={isSubmitting}
                        onClick={handleSubmit}
                        size="xs"
                      >
                        Submit
                      </Button>
                      <Button
                        data-umami-event="cancel reply comment"
                        disabled={isSubmitting}
                        onClick={handleCancel}
                        size="xs"
                        variant="subtle"
                      >
                        Cancel
                      </Button>
                    </Group>

                    {errorMessage && (
                      <Text c="red" size="sm" role="alert">
                        {errorMessage}
                      </Text>
                    )}
                  </Stack>
                </Collapse>
              </Box>
            )}
          </Stack>
        </Card>

        {showReplies && (
          <>
            <Collapse in={isExpanded}>
              <Stack gap="sm" mt="sm">
                {comment.replies!.map((reply) => (
                  <CommentItem
                    key={reply.id || reply.permalink}
                    comment={reply}
                    maxDepth={maxDepth}
                  />
                ))}
              </Stack>
            </Collapse>

            {!isExpanded && comment.replies && comment.replies.length > 0 && (
              <output
                className={classes.collapsedPreview}
                aria-label="Collapsed replies preview"
              >
                <Text size="xs" c="dimmed" mb={4}>
                  {comment.replies.length}{' '}
                  {comment.replies.length === 1 ? 'reply' : 'replies'} collapsed
                </Text>
                {comment.replies[0]?.body && (
                  <Text
                    size="xs"
                    c="dimmed"
                    lineClamp={1}
                    dangerouslySetInnerHTML={{
                      __html: decodeAndSanitizeHtml(
                        `${comment.replies[0].author}: ${comment.replies[0].body.slice(0, 100)}${comment.replies[0].body.length > 100 ? '...' : ''}`
                      )
                    }}
                  />
                )}
              </output>
            )}
          </>
        )}

        {hasReplies && comment.depth >= maxDepth && (
          <Box mt="sm" ml="md">
            <Text size="sm" c="dimmed" fs="italic">
              {comment.replies!.length} more{' '}
              {comment.replies!.length === 1 ? 'reply' : 'replies'} (depth limit
              reached)
            </Text>
          </Box>
        )}
      </div>

      <Modal
        centered
        closeOnClickOutside={false}
        onClose={handleDeleteCancel}
        opened={deleteModalOpened}
        title="Delete Comment"
      >
        <Text mb="lg">
          Are you sure you want to delete this comment? This action cannot be
          undone.
        </Text>
        <Group gap="sm" justify="flex-end">
          <Button
            data-umami-event="cancel delete comment"
            onClick={handleDeleteCancel}
            variant="subtle"
          >
            Cancel
          </Button>
          <Button
            color="red"
            data-umami-event="confirm delete comment"
            onClick={handleDeleteConfirm}
          >
            Delete
          </Button>
        </Group>
      </Modal>
    </Box>
  )
}
