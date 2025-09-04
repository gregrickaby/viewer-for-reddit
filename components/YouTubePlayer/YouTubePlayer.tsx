'use client'

import {Button} from '@mantine/core'
import {useInViewport} from '@mantine/hooks'

interface YouTubePlayerProps {
  videoId: string
}

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
