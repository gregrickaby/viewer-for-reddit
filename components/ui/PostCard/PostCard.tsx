'use client'

import {useSavePost, useVote} from '@/lib/hooks'
import {RedditPost} from '@/lib/types/reddit'
import {decodeHtmlEntities, sanitizeText} from '@/lib/utils/formatters'
import {extractSlug} from '@/lib/utils/reddit-helpers'
import {Anchor, Card, Stack, Text} from '@mantine/core'
import Link from 'next/link'
import {memo} from 'react'
import {PostActions} from '../PostActions/PostActions'
import {PostHeader} from '../PostHeader/PostHeader'
import {PostMedia} from '../PostMedia/PostMedia'
import styles from './PostCard.module.css'

/**
 * Props for the PostCard component.
 */
interface PostCardProps {
  /** Reddit post data */
  post: RedditPost
  /** Whether the current user is authenticated */
  isAuthenticated?: boolean
  /** Whether to show the full post text (for single post view) */
  showFullText?: boolean
}

/**
 * Display a Reddit post in card format.
 * Includes header, title, media, optional self-text, and action buttons.
 *
 * Features:
 * - Optimistic voting and saving with useVote/useSavePost hooks
 * - HTML sanitization for user-generated content
 * - Responsive media display (images, videos, galleries)
 * - Memoized for performance
 *
 * @example
 * ```typescript
 * <PostCard
 *   post={redditPost}
 *   isAuthenticated={true}
 *   showFullText={false}
 * />
 * ```
 */
export const PostCard = memo(
  ({
    post,
    isAuthenticated = false,
    showFullText = false
  }: Readonly<PostCardProps>) => {
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
      initialSaved: post.saved || false
    })

    const isPending = isVotePending || isSavePending

    return (
      <Card withBorder padding="md" radius="md">
        <Stack gap="xs">
          <PostHeader post={post} />

          <Anchor
            component={Link}
            href={postUrl}
            underline="never"
            c="inherit"
            data-umami-event="post-title-click"
          >
            <Text size="md" fw={600} mt={2}>
              {post.title}
            </Text>
          </Anchor>

          <PostMedia post={post} />

          {post.selftext && (
            <>
              {showFullText && post.selftext_html ? (
                <div
                  dangerouslySetInnerHTML={{
                    __html: sanitizeText(
                      decodeHtmlEntities(post.selftext_html)
                    )
                  }}
                  className={styles.postBody}
                />
              ) : (
                <Anchor
                  component={Link}
                  href={postUrl}
                  underline="never"
                  c="dimmed"
                  style={{textDecoration: 'none'}}
                  data-umami-event="post-text-preview-click"
                >
                  <Text size="sm" c="dimmed" lineClamp={3}>
                    {post.selftext}
                  </Text>
                </Anchor>
              )}
            </>
          )}

          <PostActions
            postUrl={postUrl}
            numComments={post.num_comments}
            voteState={voteState}
            score={score}
            isSaved={isSaved}
            isPending={isPending}
            onVote={vote}
            onToggleSave={toggleSave}
            isAuthenticated={isAuthenticated}
          />
        </Stack>
      </Card>
    )
  }
)
