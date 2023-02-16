import {createStyles} from '@mantine/core'
import {useViewportSize} from '@mantine/hooks'
import HlsPlayer from '~/components/HlsPlayer'
import {useRedditContext} from '~/components/RedditProvider'
import {Post} from '~/lib/types'

interface StylesProps {
  props: Post
  blurNSFW: boolean
}

const useStyles = createStyles((theme, {props, blurNSFW}: StylesProps) => ({
  media: {
    backgroundColor:
      theme.colorScheme === 'dark' ? theme.colors.dark[5] : theme.colors.dark[0]
  },

  // For media that doesn't contain an obfuscated image, blur.
  blur: {
    filter: props?.over_18 && blurNSFW ? 'blur(10px)' : 'none'
  }
}))

/**
 * Card component.
 */
export default function Media(props: Post) {
  const {blurNSFW} = useRedditContext()
  const {classes, cx, theme} = useStyles({props, blurNSFW})
  const {width} = useViewportSize()

  /**
   * Decide whether to lazy load media.
   *
   * @returns string - 'lazy' or 'eager'
   */
  function maybeLazyLoad() {
    // For large desktop, eager load the first 12 images.
    if (width > 1200) {
      return props.index > 11 ? 'lazy' : 'eager'
    }

    // For small desktop, eager load the first 9 images.
    if (width > 1024) {
      return props.index > 8 ? 'lazy' : 'eager'
    }

    // For tablet, eager load the first 6 images.
    if (width > 768) {
      return props.index > 5 ? 'lazy' : 'eager'
    }

    // For mobile, eager load the first 2 images.
    return props.index > 1 ? 'lazy' : 'eager'
  }

  switch (props?.post_hint) {
    case 'image':
      return (
        <img
          alt={props?.title}
          className={classes.media}
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
          className={classes.media}
          src={props?.media?.reddit_video?.hls_url}
          controls
          crossOrigin="anonymous"
          dataHint="hosted:video"
          height={props?.media?.reddit_video?.height}
          playsInline
          poster={
            props?.over_18 && blurNSFW
              ? props?.images?.obfuscated?.url
              : props?.images?.cropped?.url
          }
          preload="metadata"
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
          className={classes.media}
          controls
          crossOrigin="anonymous"
          dataHint="rich:video"
          height={props?.video_preview?.height}
          muted
          playsInline
          poster={
            props?.over_18 && blurNSFW
              ? props?.images?.obfuscated?.url
              : props?.images?.cropped?.url
          }
          preload="metadata"
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
            className={cx(classes.media, classes.blur)}
            data-hint="rich:video-iframe"
            loading={maybeLazyLoad()}
            referrerPolicy="no-referrer"
            sandbox="allow-scripts allow-same-origin allow-presentation"
            src={props?.secure_media_embed?.media_domain_url}
            style={{border: 'none', height: '100%', width: '100%'}}
            title="iframe"
          />
        </div>
      )
    case 'link':
      // Search for .gifv and use the mp4 version.
      return props?.url.includes('gifv') ? (
        <HlsPlayer
          className={classes.media}
          controls
          dataHint="link:gifv"
          muted
          playsInline
          poster={
            props?.over_18 && blurNSFW
              ? props?.images?.obfuscated?.url
              : props?.images?.cropped?.url
          }
          preload="metadata"
        >
          <source src={props?.url.replace('.gifv', '.mp4')} type="video/mp4" />
        </HlsPlayer>
      ) : (
        // Otherwise, just play the video.
        <HlsPlayer
          className={classes.media}
          controls
          crossOrigin="anonymous"
          dataHint="link"
          height={props?.video_preview?.height}
          muted
          playsInline
          poster={
            props?.over_18 && blurNSFW
              ? props?.images?.obfuscated?.url
              : props?.images?.cropped?.url
          }
          preload="metadata"
          width={props?.video_preview?.width}
        >
          <source src={props?.video_preview?.fallback_url} type="video/mp4" />
        </HlsPlayer>
      )
    default:
      return <></>
  }
}
