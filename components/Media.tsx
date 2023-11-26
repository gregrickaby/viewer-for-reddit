'use client'

import HlsPlayer from '@/components/HlsPlayer'
import {useRedditContext} from '@/components/RedditProvider'
import {Post} from '@/lib/types'
import {useViewportSize} from '@mantine/hooks'

/**
 * Card component.
 */
export default function Media(props: Post) {
  const {autoPlay, blurNSFW} = useRedditContext()
  const {width} = useViewportSize()
  const maybeBlur = {
    filter: props?.over_18 && blurNSFW ? 'blur(10px)' : 'none'
  }

  /**
   * Decide whether to lazy load media.
   *
   * @returns string - 'lazy' or 'eager'
   */
  function maybeLazyLoad() {
    // For large desktop, eager load the first 6 images.
    if (width > 1200) {
      return props.index > 6 ? 'lazy' : 'eager'
    }

    // For small desktop, eager load the first 4 images.
    if (width > 1024) {
      return props.index > 4 ? 'lazy' : 'eager'
    }

    // For tablet, eager load the first 6 images.
    if (width > 768) {
      return props.index > 6 ? 'lazy' : 'eager'
    }

    // For mobile, eager load the first 3 images.
    return props.index > 3 ? 'lazy' : 'eager'
  }

  switch (props?.post_hint) {
    case 'image':
      return (
        <img
          alt={props?.title}
          style={maybeBlur}
          data-hint="image"
          decoding="async"
          height={
            props?.over_18 && blurNSFW
              ? props?.images?.obfuscated?.height
              : props?.images?.cropped?.height
          }
          loading={maybeLazyLoad()}
          src={
            props?.over_18 && blurNSFW
              ? props?.images?.obfuscated?.url
              : props?.images?.cropped?.url
          }
          width={
            props?.over_18 && blurNSFW
              ? props?.images?.obfuscated?.width
              : props?.images?.cropped?.width
          }
        />
      )
    case 'hosted:video':
      return (
        <HlsPlayer
          autoPlay={autoPlay}
          style={maybeBlur}
          controls
          crossOrigin="anonymous"
          dataHint="hosted:video"
          height={props?.media?.reddit_video?.height}
          loop
          playsInline
          poster={
            props?.over_18 && blurNSFW
              ? props?.images?.obfuscated?.url
              : props?.images?.cropped?.url
          }
          preload="metadata"
          src={props?.video_preview?.hls_url}
          width={props?.media?.reddit_video?.width}
        >
          <source
            src={props?.media?.reddit_video?.fallback_url}
            type="video/mp4"
          />
        </HlsPlayer>
      )
    case 'rich:video':
      return props?.video_preview ? (
        <HlsPlayer
          autoPlay={autoPlay}
          style={maybeBlur}
          controls
          crossOrigin="anonymous"
          dataHint="rich:video"
          height={props?.video_preview?.height}
          loop
          muted
          playsInline
          poster={
            props?.over_18 && blurNSFW
              ? props?.images?.obfuscated?.url
              : props?.images?.cropped?.url
          }
          preload="metadata"
          src={props?.video_preview?.hls_url}
          width={props?.video_preview?.width}
        >
          <source src={props?.video_preview?.fallback_url} type="video/mp4" />
        </HlsPlayer>
      ) : (
        <div
          style={{
            height: props?.secure_media_embed?.height,
            width: props?.secure_media_embed?.width
          }}
        >
          <iframe
            allow="fullscreen"
            data-hint="rich:video-iframe"
            loading={maybeLazyLoad()}
            referrerPolicy="no-referrer"
            sandbox="allow-scripts allow-same-origin allow-presentation"
            src={props?.secure_media_embed?.media_domain_url}
            style={{
              border: 'none',
              height: '100%',
              width: '100%',
              ...maybeBlur
            }}
            title="iframe"
          />
        </div>
      )
    case 'link':
      // Search for .gifv and use the mp4 version.
      return props?.url.includes('gifv') ? (
        <HlsPlayer
          autoPlay={autoPlay}
          style={maybeBlur}
          controls
          crossOrigin="anonymous"
          dataHint="link:gifv"
          loop
          muted
          playsInline
          poster={
            props?.over_18 && blurNSFW
              ? props?.images?.obfuscated?.url
              : props?.images?.cropped?.url
          }
          src={props?.video_preview?.hls_url}
          preload="metadata"
        >
          <source src={props?.url.replace('.gifv', '.mp4')} type="video/mp4" />
        </HlsPlayer>
      ) : (
        // Otherwise, just play the video.
        <HlsPlayer
          autoPlay={autoPlay}
          style={maybeBlur}
          controls
          crossOrigin="anonymous"
          dataHint="link"
          height={props?.video_preview?.height}
          loop
          muted
          playsInline
          poster={
            props?.over_18 && blurNSFW
              ? props?.images?.obfuscated?.url
              : props?.images?.cropped?.url
          }
          preload="metadata"
          src={props?.video_preview?.hls_url}
          width={props?.video_preview?.width}
        >
          <source src={props?.video_preview?.fallback_url} type="video/mp4" />
        </HlsPlayer>
      )
    default:
      return <></>
  }
}
