'use client'

import {
  extractMediaLinks,
  getMediaType,
  normalizeMediaUrl
} from '@/lib/utils/formatting/commentMediaHelpers'
import {Box, Image} from '@mantine/core'

export interface CommentMediaProps {
  /**
   * HTML content from comment body_html
   */
  readonly bodyHtml: string
}

/**
 * Renders inline media (images/GIFs/videos) from comment links
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
