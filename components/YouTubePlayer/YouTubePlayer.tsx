'use client'

import {useYouTubeVideo} from '@/lib/hooks/useYouTubeVideo'
import {Button} from '@mantine/core'
import {useMemo} from 'react'

interface YouTubePlayerProps {
  videoId: string
}

export function YouTubePlayer({videoId}: Readonly<YouTubePlayerProps>) {
  const {ref, isVisible, setIsVisible} = useYouTubeVideo()

  const thumbnailUrl = useMemo(
    () => `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
    [videoId]
  )

  if (isVisible) {
    return (
      <iframe
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        height="100%"
        loading="lazy"
        src={`https://www.youtube.com/embed/${videoId}`}
        style={{position: 'absolute', top: 0, left: 0}}
        title="YouTube video player"
        width="100%"
      />
    )
  }

  return (
    <Button
      ref={ref}
      type="button"
      aria-label="Play YouTube video"
      onClick={() => setIsVisible(true)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          setIsVisible(true)
        }
      }}
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
