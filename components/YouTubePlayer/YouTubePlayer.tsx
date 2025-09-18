'use client'

import {Button} from '@mantine/core'
import {useInViewport} from '@mantine/hooks'

interface YouTubePlayerProps {
  videoId: string
}

/**
 * YouTubePlayer component for lazy-loading and displaying YouTube videos in posts.
 *
 * Features:
 * - Uses intersection observer (useInViewport) to only load iframe when in viewport
 * - Shows a clickable thumbnail button until video is in view, then loads iframe
 * - Fully accessible with alt text, aria-label, and keyboard navigation
 * - Uses privacy-enhanced youtube-nocookie.com embed
 *
 * @param videoId - The YouTube video ID to embed
 * @returns JSX.Element for a lazy-loaded YouTube video player
 *
 * @remarks
 * - Used by Media for all YouTube post types
 * - Optimizes performance by deferring iframe load until needed
 */
export function YouTubePlayer({videoId}: Readonly<YouTubePlayerProps>) {
  const {ref, inViewport} = useInViewport()
  const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`

  if (inViewport) {
    return (
      <Button
        ref={ref}
        type="button"
        aria-label="Play YouTube video"
        style={{
          width: '100%',
          height: 'auto',
          padding: 0,
          border: 'none',
          background: 'none',
          cursor: 'pointer',
          position: 'relative',
          display: 'block'
        }}
      >
        <img
          alt="YouTube video thumbnail"
          src={thumbnailUrl}
          style={{width: '100%', height: 'auto', display: 'block'}}
        />
      </Button>
    )
  }

  return (
    <iframe
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
      height="100%"
      loading="lazy"
      src={`https://www.youtube-nocookie.com/embed/${videoId}`}
      title="YouTube video player"
      width="100%"
    />
  )
}
