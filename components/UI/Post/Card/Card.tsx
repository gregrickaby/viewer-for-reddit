import {Comments} from '@/components/UI/Post/Comments/Comments'
import {Media} from '@/components/UI/Post/Media/Media'
import type {AutoPostChildData} from '@/lib/store/services/postsApi'
import {getMediumImage} from '@/lib/utils/formatting/getMediumImage'
import {parsePostLink} from '@/lib/utils/formatting/parsePostLink'
import {Anchor, Collapse, Card as MantineCard, Title} from '@mantine/core'
import Link from 'next/link'
import {useState} from 'react'
import classes from './Card.module.css'
import {CardActions} from './CardActions'
import {CardHeader} from './CardHeader'

interface CardProps {
  post: AutoPostChildData
  useInternalRouting?: boolean
}

/**
 * Card component for rendering a single Reddit post with all metadata and media.
 *
 * Features:
 * - Displays subreddit, title, upvotes, comment count, and post age
 * - Renders media (image, video, YouTube, etc.) using the Media component
 * - Shows a comments toggle with animated collapse for in-place comment viewing
 * - Uses Mantine UI for layout, icons, and accessibility
 * - Supports both internal app routing and external Reddit links
 *
 * @param post - The Reddit post data (AutoPostChildData)
 * @param useInternalRouting - Whether to use internal app routes (default: true) or external Reddit links
 * @returns JSX.Element for a styled, interactive Reddit post card
 */
export function Card({post, useInternalRouting = true}: Readonly<CardProps>) {
  const preview = (post as any).preview?.images?.[0]?.resolutions
  const image = getMediumImage(preview ?? [])
  const postLink = parsePostLink(post.permalink, useInternalRouting)
  const postPermalink = post.permalink ?? post.id ?? ''
  const [commentsOpen, setCommentsOpen] = useState(false)

  // Check if post has media (image, gallery, video, etc.)
  const hasMedia =
    image?.url ||
    (post as any).is_gallery ||
    (post as any).post_hint === 'hosted:video' ||
    (post as any).post_hint === 'rich:video' ||
    (post as any).media_embed?.provider_name === 'YouTube'

  return (
    <MantineCard component="article">
      <CardHeader post={post} />

      {useInternalRouting ? (
        <Link className={classes.link} href={postLink}>
          <Title className={classes.title} order={2} size="lg">
            {post.title}
          </Title>
        </Link>
      ) : (
        <Anchor
          className={classes.link}
          href={postLink}
          rel="noopener noreferrer"
          target="_blank"
          underline="never"
        >
          <Title className={classes.title} order={2} size="lg">
            {post.title}
          </Title>
        </Anchor>
      )}

      {hasMedia && (
        <MantineCard.Section m={0} p={0}>
          <Media {...post} />
        </MantineCard.Section>
      )}

      <CardActions
        post={post}
        commentsOpen={commentsOpen}
        onCommentsToggle={() => setCommentsOpen(!commentsOpen)}
      />

      <Collapse in={commentsOpen}>
        <Comments
          open={commentsOpen}
          permalink={postPermalink}
          postLink={postLink}
          enableNestedComments
        />
      </Collapse>
    </MantineCard>
  )
}
