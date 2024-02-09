import HlsPlayer from '@/app/r/[slug]/components/HlsPlayer'
import {RedditPost, ImageAsset} from '@/lib/types'

/**
 * Pluck out a medium sized image.
 */
function getMediumImage(images: ImageAsset[]): ImageAsset | null {
  // If there are no images, return null.
  if (!Array.isArray(images) || images.length === 0) {
    return null
  }

  // Try to find an image with 640px resolution.
  const mediumSize = images.find((res) => res.width === 640)

  // Return the medium sized image; otherwise, return the highest resolution.
  return mediumSize || images[images.length - 1]
}

/**
 * The media component.
 */
export default function Media(post: RedditPost) {
  /**
   * Reddit images can be huge. Try to find a medium sized image.
   */
  const mediumImageAsset = getMediumImage(post.preview.images[0].resolutions)

  /**
   * Read the post hint, then render the appropriate media.
   */
  switch (post.post_hint) {
    case 'image':
      return (
        <a href={post.permalink}>
          <img
            alt={post.title}
            data-hint="image"
            decoding="async"
            loading="lazy"
            height={mediumImageAsset?.height}
            src={mediumImageAsset?.url}
            width={mediumImageAsset?.width}
          />
        </a>
      )
    case 'hosted:video':
      return (
        <HlsPlayer
          autoPlay={false}
          controls
          crossOrigin="anonymous"
          dataHint="hosted:video"
          height={post.media?.reddit_video?.height}
          loop
          playsInline
          poster={mediumImageAsset?.url}
          preload="metadata"
          src={post.video_preview?.hls_url}
          width={post.media?.reddit_video?.width}
        >
          <source
            src={post.media?.reddit_video?.fallback_url}
            type="video/mp4"
          />
        </HlsPlayer>
      )
    case 'rich:video':
      return post.preview.reddit_video_preview ? (
        <HlsPlayer
          autoPlay={false}
          controls
          crossOrigin="anonymous"
          dataHint="rich:video"
          height={post.preview.reddit_video_preview.height}
          loop
          muted
          playsInline
          poster={mediumImageAsset?.url}
          preload="metadata"
          src={post.preview.reddit_video_preview.hls_url}
          width={post.preview.reddit_video_preview.width}
        >
          <source
            src={post.preview.reddit_video_preview.fallback_url}
            type="video/mp4"
          />
        </HlsPlayer>
      ) : (
        <div className="w-64">
          <iframe
            allow="fullscreen"
            data-hint="rich:video-iframe"
            loading="lazy"
            referrerPolicy="no-referrer"
            sandbox="allow-scripts allow-same-origin allow-presentation"
            src={post.secure_media_embed?.media_domain_url}
            style={{
              border: 'none',
              height: '100%',
              width: '100%'
            }}
            title="iframe"
          />
        </div>
      )
    case 'link':
      // Search for .gifv and use the mp4 version.
      return post.url.includes('gifv') ? (
        <HlsPlayer
          autoPlay={false}
          controls
          crossOrigin="anonymous"
          dataHint="link:gifv"
          loop
          muted
          playsInline
          poster={mediumImageAsset?.url}
          src={post.video_preview?.hls_url}
          preload="metadata"
        >
          <source src={post.url.replace('.gifv', '.mp4')} type="video/mp4" />
        </HlsPlayer>
      ) : (
        // Otherwise, just play the video.
        <HlsPlayer
          autoPlay={false}
          controls
          crossOrigin="anonymous"
          dataHint="link"
          height={post.video_preview?.height}
          loop
          muted
          playsInline
          poster={mediumImageAsset?.url}
          preload="metadata"
          src={post.video_preview?.hls_url}
          width={post.video_preview?.width}
        >
          <source src={post.video_preview?.fallback_url} type="video/mp4" />
        </HlsPlayer>
      )
    default:
      return <></>
  }
}
