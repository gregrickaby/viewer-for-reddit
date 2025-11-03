'use client'

import {
  extractMediaLinks,
  getMediaType,
  normalizeMediaUrl
} from '@/lib/utils/formatting/comments/commentMediaHelpers'
import {Box, Image} from '@mantine/core'

/**
 * Props for the CommentMedia component.
 */
export interface CommentMediaProps {
  /** The comment body HTML to extract media links from */
  bodyHtml: string
}

/**
 * Renders inline media (images/GIFs/videos) extracted from comment links.
 *
 * Parses comment HTML to find media links (imgur, gfycat, etc.) and
 * renders them as images or video players. Handles lazy loading and
 * provides accessible alt text and aria-labels.
 *
 * Features:
 * - Extracts media links from comment HTML
 * - Renders images with lazy loading
 * - Renders video players with controls
 * - Max width 400px for responsive display
 * - Returns null if no media found
 *
 * @param {CommentMediaProps} props - Component props
 * @returns JSX.Element media elements or null if no media found
 */
export function CommentMedia({bodyHtml}: Readonly<CommentMediaProps>) {
  const mediaLinks = extractMediaLinks(bodyHtml)

  if (mediaLinks.length === 0) {
    return null
  }

  return (
    <Box mt="sm">
      {mediaLinks.map((link) => {
        const normalizedUrl = normalizeMediaUrl(link.url)
        const mediaType = getMediaType(normalizedUrl)

        if (mediaType === 'image') {
          return (
            <Image
              key={normalizedUrl}
              src={normalizedUrl}
              alt={link.text || 'Comment image'}
              maw={400}
              radius="md"
              mb="xs"
              loading="lazy"
            />
          )
        }

        if (mediaType === 'video') {
          return (
            <Box key={normalizedUrl} maw={400} mb="xs">
              <video
                data-testid="comment-video"
                src={normalizedUrl}
                controls
                loop
                muted
                autoPlay
                aria-label={link.text || 'Comment video'}
                style={{
                  width: '100%',
                  height: 'auto',
                  borderRadius: 'var(--mantine-radius-md)'
                }}
              />
            </Box>
          )
        }

        // Fallback to regular link if media type unknown
        return null
      })}
    </Box>
  )
}
