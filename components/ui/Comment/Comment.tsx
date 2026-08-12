'use client'

import {ActionPill} from '@/components/ui/ActionPill/ActionPill'
import {TimeAgo} from '@/components/ui/TimeAgo/TimeAgo'
import {VotePill} from '@/components/ui/VotePill/VotePill'
import {useCommentCollapse} from '@/lib/hooks/useCommentCollapse'
import {useSavePost} from '@/lib/hooks/useSavePost'
import {useSharePost} from '@/lib/hooks/useSharePost'
import {useUserAvatar} from '@/lib/hooks/useUserAvatar'
import {useVote} from '@/lib/hooks/useVote'
import {
  RedditAward,
  RedditComment as RedditCommentType
} from '@/lib/types/reddit'
import {MAX_COMMENT_DEPTH} from '@/lib/utils/constants'
import {decodeHtmlEntities, sanitizeText} from '@/lib/utils/formatters'
import {
  getInternalPostHref,
  getUserProfileHref
} from '@/lib/utils/reddit-helpers'
import {
  ActionIcon,
  Anchor,
  Avatar,
  Badge,
  Box,
  Card,
  Collapse,
  Group,
  Stack,
  Text,
  Tooltip
} from '@mantine/core'
import {notifications} from '@mantine/notifications'
import {
  IconBookmark,
  IconBookmarkFilled,
  IconChevronDown,
  IconChevronUp,
  IconShare
} from '@tabler/icons-react'
import Image from 'next/image'
import Link from 'next/link'
import styles from './Comment.module.css'

/**
 * Convert a Reddit permalink to an internal app route.
 * Reddit format: /r/subreddit/comments/postid/slug/commentid/comment_name/
 * App format: /r/subreddit/comments/postid/slug/commentid
 */
function getCommentPermalink(permalink: string): string {
  const parts = permalink.split('/').filter(Boolean)
  // parts: ['r', 'subreddit', 'comments', 'postid', 'slug', 'commentid', 'comment_name']
  if (parts.length >= 6) {
    return `/${parts[0]}/${parts[1]}/${parts[2]}/${parts[3]}/${parts[4]}/${parts[5]}`
  }
  return permalink
}

/**
 * Props for the Comment component.
 */
interface CommentProps {
  /** Reddit comment data */
  comment: RedditCommentType
  /** Nesting depth (for indentation) */
  depth?: number
  /** Optional callback when item is unsaved (for saved items list) */
  onUnsave?: () => void
}

/**
 * Reddit system accounts and tombstoned authors that have no real profile
 * to link to or avatar to fetch.
 */
function isSpecialUser(author: string): boolean {
  return (
    author === '[deleted]' ||
    author === '[removed]' ||
    author === 'AutoModerator'
  )
}

/**
 * Render a comment author's avatar. Lazily fetched via `useUserAvatar` once
 * scrolled into view, and skipped entirely for system/tombstoned accounts.
 */
function CommentAvatar({author}: Readonly<{author: string}>) {
  const special = isSpecialUser(author)
  const {avatarUrl, ref} = useUserAvatar(special ? null : author)

  if (special) return null

  return (
    <Box ref={ref}>
      <Avatar
        src={avatarUrl}
        alt={`${author}'s avatar`}
        size={20}
        radius="xl"
      />
    </Box>
  )
}

/**
 * Helper to render author name (special users vs normal users)
 */
function renderAuthor(author: string) {
  const href = isSpecialUser(author) ? null : getUserProfileHref(author)

  if (!href) {
    return (
      <Text size="sm" fw={600} c="dimmed">
        u/{author}
      </Text>
    )
  }

  return (
    <Anchor component={Link} href={href} size="sm" fw={600} underline="hover">
      u/{author}
    </Anchor>
  )
}

/**
 * Render award icons with tooltips showing award name and count
 */
function renderAwards(awardings: RedditAward[]) {
  return (
    <Group gap={4}>
      {awardings.map((award) => (
        <Tooltip key={award.id} label={`${award.name} × ${award.count}`}>
          <Image
            src={award.icon_url}
            alt={award.name}
            width={18}
            height={18}
            className={styles.awardIcon}
          />
        </Tooltip>
      ))}
    </Group>
  )
}

/**
 * Render the parent post's subreddit badge and title above a comment.
 * Only present on user profile comment listings, where a comment is shown
 * out of context and needs a link back to the post it belongs to. Falls
 * back to the subreddit badge alone when the title isn't available.
 */
function renderPostContext(comment: RedditCommentType) {
  if (!comment.link_permalink) return null

  const postHref = getInternalPostHref(comment.link_permalink)

  return (
    <Group gap={6} mb={4} wrap="nowrap">
      {comment.subreddit_name_prefixed && (
        <Badge
          component={Link}
          href={`/r/${comment.subreddit}`}
          scroll
          size="xs"
          variant="light"
          style={{cursor: 'pointer', flexShrink: 0}}
        >
          {comment.subreddit_name_prefixed}
        </Badge>
      )}
      {comment.link_title && postHref && (
        <Anchor
          c="inherit"
          component={Link}
          href={postHref}
          scroll
          size="sm"
          fw={700}
          truncate="end"
          style={{minWidth: 0}}
        >
          {comment.link_title}
        </Anchor>
      )}
    </Group>
  )
}

/**
 * Render vote action buttons with score display. Shares `VotePill` with
 * `PostActions` so vote controls look identical on posts and comments.
 */
function renderVoteActions(
  voteState: 1 | 0 | -1 | null,
  score: number,
  isPending: boolean,
  vote: (direction: 1 | -1) => void
) {
  return (
    <VotePill
      voteState={voteState}
      score={score}
      isPending={isPending}
      onVote={vote}
      upvoteLabel={`${voteState === 1 ? 'Upvoted' : 'Upvote'} comment (${score} points)`}
      downvoteLabel={`${voteState === -1 ? 'Downvoted' : 'Downvote'} comment (${score} points)`}
    />
  )
}

/**
 * Render save and share action buttons. Shares `ActionPill` with
 * `PostActions` so these controls look identical on posts and comments.
 */
function renderActionButtons(
  isSaved: boolean,
  isPending: boolean,
  handleSave: () => void,
  handleShare: () => void
) {
  return (
    <>
      <ActionPill
        onClick={handleSave}
        disabled={isPending}
        ariaLabel={isSaved ? 'Unsave comment' : 'Save comment'}
        icon={
          isSaved ? (
            <IconBookmarkFilled
              aria-hidden="true"
              size={16}
              color="var(--mantine-color-yellow-6)"
            />
          ) : (
            <IconBookmark aria-hidden="true" size={16} />
          )
        }
      />
      <ActionPill
        onClick={handleShare}
        ariaLabel="Share comment"
        icon={<IconShare aria-hidden="true" size={16} />}
      />
    </>
  )
}

/**
 * Display a Reddit comment with voting and nested replies.
 * Recursively renders child comments with proper indentation.
 */
export function Comment({
  comment,
  depth = 0,
  onUnsave
}: Readonly<CommentProps>) {
  const {isCollapsed, toggleCollapse} = useCommentCollapse()
  const {sharePost} = useSharePost()

  const {
    voteState,
    score,
    isPending: isVotePending,
    vote
  } = useVote({
    itemName: comment.name,
    initialLikes: comment.likes,
    initialScore: comment.score
  })

  const {
    isSaved,
    isPending: isSavePending,
    toggleSave
  } = useSavePost({
    postName: comment.name,
    initialSaved: comment.saved || false,
    onUnsave
  })

  const isPending = isVotePending || isSavePending
  const isGilded = Boolean(comment.all_awardings?.length)

  const replies =
    comment.replies?.data?.children?.filter(
      (child): child is {kind: 't1'; data: RedditCommentType} =>
        child.kind === 't1'
    ) || []

  const handleShare = () => sharePost(comment.permalink)

  const handleSave = () => {
    toggleSave()
    notifications.show({
      message: isSaved ? 'Comment unsaved' : 'Comment saved',
      color: isSaved ? 'gray' : 'yellow',
      autoClose: 3000
    })
  }

  return (
    <Box
      ml={depth > 0 ? 20 : 0}
      className={depth > 0 ? styles.threadLine : undefined}
    >
      {depth > 0 && (
        <button
          type="button"
          className={styles.threadLineToggle}
          onClick={toggleCollapse}
          aria-label={isCollapsed ? 'Expand thread' : 'Collapse thread'}
        />
      )}

      {renderPostContext(comment)}

      <Card
        padding="xs"
        radius="md"
        mb="xs"
        bg={
          isGilded
            ? 'var(--mantine-color-yellow-light)'
            : 'var(--mantine-color-body)'
        }
        className={isGilded ? styles.gilded : undefined}
      >
        <Stack gap="xs">
          <Group gap="xs">
            <ActionIcon
              variant="subtle"
              size="sm"
              color="gray"
              onClick={toggleCollapse}
              aria-label={isCollapsed ? 'Expand comment' : 'Collapse comment'}
              aria-expanded={!isCollapsed}
            >
              {isCollapsed ? (
                <IconChevronDown aria-hidden="true" size={16} />
              ) : (
                <IconChevronUp aria-hidden="true" size={16} />
              )}
            </ActionIcon>
            <CommentAvatar author={comment.author} />
            {renderAuthor(comment.author)}
            {comment.distinguished && (
              <Badge size="xs" color="green">
                {comment.distinguished}
              </Badge>
            )}
            {comment.all_awardings &&
              comment.all_awardings.length > 0 &&
              renderAwards(comment.all_awardings)}
            <Text size="xs" c="dimmed">
              <TimeAgo timestamp={comment.created_utc} />
            </Text>
            {isCollapsed && replies.length > 0 && (
              <Text size="xs" c="dimmed">
                ({replies.length} {replies.length === 1 ? 'reply' : 'replies'})
              </Text>
            )}
          </Group>

          <Collapse expanded={!isCollapsed}>
            <Stack gap="xs">
              <div
                dangerouslySetInnerHTML={{
                  __html: sanitizeText(
                    comment.body_html
                      ? decodeHtmlEntities(comment.body_html)
                      : comment.body
                  )
                }}
                className={styles.commentBody}
              />

              <Group gap="sm">
                {renderVoteActions(voteState, score, isPending, vote)}
                {renderActionButtons(
                  isSaved,
                  isPending,
                  handleSave,
                  handleShare
                )}
              </Group>
            </Stack>
          </Collapse>
        </Stack>
      </Card>

      <Collapse expanded={!isCollapsed}>
        {depth >= MAX_COMMENT_DEPTH ? (
          <Anchor
            component={Link}
            href={getCommentPermalink(comment.permalink)}
            c="blue"
            fz="sm"
            ml={20}
            mb="sm"
          >
            Continue this thread →
          </Anchor>
        ) : (
          replies.map((reply) => (
            <Comment
              key={reply.data.id}
              comment={reply.data}
              depth={depth + 1}
            />
          ))
        )}
      </Collapse>
    </Box>
  )
}
