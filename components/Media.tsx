import HlsPlayer from '@/components/HlsPlayer'
import {getMediumImage} from '@/lib/functions'
import {RedditPost} from '@/lib/types'

/**
 * The media component.
 */
export default function Media(post: Readonly<RedditPost>) {
  // No post? Bail.
  if (!post) {
    return null
  }

  // Set the medium image asset.
  const mediumImageAsset = getMediumImage(post.preview?.images[0]?.resolutions)

  // Set HLS player defaults.
  const hlsDefaults = {
    autoPlay: false,
    controls: true,
    crossOrigin: 'anonymous',
    loop: true,
    muted: true,
    playsInline: true,
    preload: 'metadata'
  }

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
      const videoPreview =
        post.preview?.reddit_video_preview || post.media?.reddit_video
      return (
        <HlsPlayer
          {...hlsDefaults}
          dataHint={post.post_hint}
          height={videoPreview?.height}
          id={post.id}
          src={videoPreview?.hls_url}
          width={videoPreview?.width}
        >
          <source src={videoPreview?.fallback_url} type="video/mp4" />
        </HlsPlayer>
      )
    }

    case 'link': {
      const isGifv = post.url?.includes('gifv')
      const videoUrl = isGifv
        ? post.url?.replace('.gifv', '.mp4')
        : post.video_preview?.fallback_url
      return (
        <HlsPlayer
          {...hlsDefaults}
          dataHint={isGifv ? 'link:gifv' : 'link'}
          height={post.video_preview?.height}
          id={post.id}
          poster={mediumImageAsset?.url}
          src={post.video_preview?.hls_url}
          width={post.video_preview?.width}
        >
          <source src={videoUrl} type="video/mp4" />
        </HlsPlayer>
      )
    }

    // Nothing matched.
    default:
      return <p>Unsupported or missing media content.</p>
  }
}
