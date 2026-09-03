'use client'

import {PostActions} from '@/components/ui/PostActions/PostActions'
import {PostHeader} from '@/components/ui/PostHeader/PostHeader'
import {PostMedia} from '@/components/ui/PostMedia/PostMedia'
import {useSavePost} from '@/lib/hooks/useSavePost'
import {useVote} from '@/lib/hooks/useVote'
import {RedditPost} from '@/lib/types/reddit'
import {decodeHtmlEntities, sanitizeText} from '@/lib/utils/formatters'
import {extractSlug} from '@/lib/utils/reddit-helpers'
import {Anchor, Badge, Divider, Stack, Text} from '@mantine/core'
import Link from 'next/link'
import styles from './PostCard.module.css'

/**
 * Render post self-text content with proper HTML/plain text handling
 */
function renderSelfText(
  post: RedditPost,
  postUrl: string,
  showFullText: boolean
) {
  if (!post.selftext_html) {
    return (
      <Anchor
        c="dimmed"
        component={Link}
        href={postUrl}
        scroll
        underline="never"
      >
        <Text size="sm" c="dimmed" lineClamp={3}>
          {post.selftext}
        </Text>
      </Anchor>
    )
  }

  const sanitizedHtml = sanitizeText(decodeHtmlEntities(post.selftext_html))

  return (
    <div
      dangerouslySetInnerHTML={{__html: sanitizedHtml}}
      className={showFullText ? styles.postBody : styles.postBodyPreview}
    />
  )
}

/**
 * Render flair content, resolving emoji shortcodes (e.g. :smilingface2:) to their
 * image via link_flair_richtext. link_flair_text alone keeps those shortcodes literal.
 */
function renderFlairContent(post: RedditPost) {
  if (post.link_flair_richtext?.length) {
    // Segment order is fixed per post and the same emoji can repeat within
    // one flair, so there's no natural unique key besides position.
    return post.link_flair_richtext.map((segment, index) =>
      segment.e === 'emoji' && segment.u ? (
        <img
          key={index}
          src={segment.u}
          alt={segment.a ?? ''}
          loading="lazy"
          decoding="async"
          className={styles.flairEmoji}
        />
      ) : (
        <span key={index}>{segment.t}</span>
      )
    )
  }

  return post.link_flair_text
}

/**
 * Render the post's flair badge, matching Reddit's own colors when provided.
 */
function renderFlair(post: RedditPost) {
  if (!post.link_flair_text) {
    return null
  }

  const hasCustomColor = Boolean(post.link_flair_background_color)

  return (
    <Badge
      radius="sm"
      size="sm"
      variant={hasCustomColor ? 'filled' : 'light'}
      style={
        hasCustomColor
          ? {
              backgroundColor: post.link_flair_background_color,
              color: post.link_flair_text_color === 'light' ? '#fff' : '#1a1a1a'
            }
          : undefined
      }
    >
      {renderFlairContent(post)}
    </Badge>
  )
}

/**
 * Props for the PostCard component.
 */
interface PostCardProps {
  /** Reddit post data */
  post: RedditPost
  /** Whether to show the full post text (for single post view) */
  showFullText?: boolean
  /** Whether this is a priority post (for LCP optimization) */
  priority?: boolean
  /** Optional callback when item is unsaved (for saved items list) */
  onUnsave?: () => void
}

/**
 * Display a Reddit post in card format.
 * Includes header, title, media, optional self-text, and action buttons.
 */
export function PostCard({
  post,
  showFullText = false,
  priority = false,
  onUnsave
}: Readonly<PostCardProps>) {
  const slug = extractSlug(post.permalink, post.id)
  const postUrl = `/r/${post.subreddit}/comments/${post.id}/${slug}`

  const {
    voteState,
    score,
    isPending: isVotePending,
    vote
  } = useVote({
    itemName: post.name,
    initialLikes: post.likes,
    initialScore: post.score
  })

  const {
    isSaved,
    isPending: isSavePending,
    toggleSave
  } = useSavePost({
    postName: post.name,
    initialSaved: post.saved || false,
    onUnsave
  })

  const isPending = isVotePending || isSavePending

  return (
    <Stack gap="xs">
      <PostHeader post={post} isDetailView={showFullText} />

      <Anchor
        c="inherit"
        component={Link}
        href={postUrl}
        scroll
        transitionTypes={['nav-forward']}
        underline="never"
      >
        <Text size="md" fw={600} mt={2}>
          {post.title}
        </Text>
      </Anchor>

      {renderFlair(post)}

      <PostMedia post={post} priority={priority} />

      {post.selftext && renderSelfText(post, postUrl, showFullText)}

      <PostActions
        postUrl={postUrl}
        numComments={post.num_comments}
        voteState={voteState}
        score={score}
        isSaved={isSaved}
        isPending={isPending}
        onVote={vote}
        onToggleSave={toggleSave}
      />

      <Divider mt="xs" />
    </Stack>
  )
}
