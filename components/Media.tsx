import {getMediumImage} from '@/lib/functions'
import type {RedditPost} from '@/lib/types'
import dynamic from 'next/dynamic'
import {Suspense, useMemo} from 'react'

// Dynamic imports.
const HlsPlayer = dynamic(() => import('@/components/HlsPlayer'))
const YouTubePlayer = dynamic(() => import('@/components/YouTubePlayer'))

// Set HLS player defaults.
const hlsDefaults = {
  autoPlay: false,
  controls: true,
  loop: true,
  muted: true,
  playsInline: true,
  preload: 'none'
}

/**
 * The media component.
 */
export default function Media(post: Readonly<RedditPost>) {
  // Set the medium image asset.
  const mediumImageAsset = useMemo(() => {
    return getMediumImage(post.preview?.images[0]?.resolutions ?? []) || null
  }, [post.preview?.images])

  // Get the YouTube video ID.
  const youtubeVideoId = useMemo(() => {
    return /embed\/([a-zA-Z0-9_-]+)/.exec(post.media?.oembed?.html ?? '')?.[1]
  }, [post.media?.oembed])

  // Determine the media type and render the appropriate component.
  switch (post.post_hint) {
    case 'image': {
      return (
        <a
          aria-label="view full image"
          href={post.url}
          rel="noopener noreferrer"
          target="_blank"
        >
          <img
            alt={post.title || 'reddit image'}
            data-hint="image"
            decoding="async"
            id={post.id}
            height={mediumImageAsset?.height}
            loading="lazy"
            src={mediumImageAsset?.url}
            width={mediumImageAsset?.width}
          />
        </a>
      )
    }

    case 'hosted:video':
    case 'rich:video': {
      // Get the Reddit-hosted video preview.
      const videoPreview =
        post.preview?.reddit_video_preview || post.media?.reddit_video

      // Determine if the media is a YouTube video.
      const isYouTube = post.media?.oembed?.provider_name === 'YouTube'

      // Render a YouTube video.
      if (isYouTube && youtubeVideoId) {
        return (
          <Suspense fallback={<div>Loading YouTube...</div>}>
            <YouTubePlayer videoId={youtubeVideoId} />
          </Suspense>
        )
      }

      // Render a reddit-hosted video.
      return (
        <HlsPlayer
          {...hlsDefaults}
          dataHint={post.post_hint}
          height={videoPreview?.height}
          id={post.id}
          poster={mediumImageAsset?.url}
          src={videoPreview?.hls_url}
          width={videoPreview?.width}
        />
      )
    }

    case 'link': {
      const isGifv = post.url?.includes('gifv')
      return (
        <HlsPlayer
          {...hlsDefaults}
          dataHint={isGifv ? 'link:gifv' : 'link'}
          height={post.video_preview?.height}
          id={post.id}
          poster={mediumImageAsset?.url}
          src={post.video_preview?.hls_url}
          width={post.video_preview?.width}
        />
      )
    }

    default:
      return post.selftext ? (
        <div
          className="prose dark:prose-invert text-left"
          dangerouslySetInnerHTML={{
            __html: post.selftext_html ?? ''
          }}
        />
      ) : (
        <p className="text-sm text-zinc-500 italic">Unsupported media.</p>
      )
  }
}
