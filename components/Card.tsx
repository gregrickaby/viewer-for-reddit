import {createStyles} from '@mantine/core'
import {useRedditContext} from '~/components/RedditProvider'
import {Post} from '~/lib/types'

const useStyles = createStyles((theme) => ({
  card: {
    overflow: 'hidden',
    paddingBottom: theme.spacing.xl
  },
  media: {
    height: 'auto',
    width: '100%',
    filter: 'brightness(0.85)',
    transition: 'all 0.25s ease-in',

    ':hover': {
      filter: 'brightness(1.25)'
    }
  },
  blurred: {
    filter: 'blur(8px)'
  }
}))

/**
 * Card component.
 */
export default function Card(props: Post) {
  const {classes, cx} = useStyles()
  const {blurNSFW} = useRedditContext()
  return (
    <div className={classes.card}>
      {(() => {
        switch (props?.post_hint) {
          case 'image':
            return (
              <a href={props?.permalink}>
                <img
                  alt={props?.title}
                  className={cx(
                    classes.media,
                    props.over_18 && blurNSFW ? classes.blurred : null
                  )}
                  data-hint="image"
                  height={props?.images?.height}
                  loading="lazy"
                  src={props?.images?.url}
                  width={props?.images?.width}
                />
              </a>
            )
          case 'hosted:video':
            return (
              <video
                className={cx(
                  classes.media,
                  props.over_18 && blurNSFW ? classes.blurred : null
                )}
                controls
                crossOrigin="anonymous"
                data-hint="hosted:video"
                height={props?.media?.reddit_video?.height}
                playsInline
                preload="metadata"
                width={props?.media?.reddit_video?.width}
              >
                <source
                  src={props?.media?.reddit_video?.fallback_url}
                  type="video/mp4"
                />
              </video>
            )
          case 'rich:video':
            return props?.video_preview ? (
              <video
                className={cx(
                  classes.media,
                  props.over_18 && blurNSFW ? classes.blurred : null
                )}
                controls
                crossOrigin="anonymous"
                data-hint="rich:video"
                height={props?.video_preview?.height}
                muted
                playsInline
                preload="metadata"
                width={props?.video_preview?.width}
              >
                <source
                  src={props?.video_preview?.fallback_url}
                  type="video/mp4"
                />
              </video>
            ) : (
              <div
                style={{
                  height: props?.secure_media_embed?.height,
                  width: props?.secure_media_embed?.width
                }}
              >
                <iframe
                  allow="fullscreen"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  sandbox="allow-scripts allow-same-origin allow-presentation"
                  src={props?.secure_media_embed?.media_domain_url}
                  style={{border: 'none', height: '100%', width: '100%'}}
                  title="iframe"
                />
              </div>
            )
          case 'link':
            // Search for .gifv....
            if (props?.url.includes('gifv')) {
              return (
                <video
                  className={cx(
                    (classes.media,
                    {[classes.blurred]: props.over_18 && blurNSFW})
                  )}
                  controls
                  data-hint="link"
                  muted
                  playsInline
                  preload="metadata"
                >
                  <source
                    src={props?.url.replace('.gifv', '.mp4')}
                    type="video/mp4"
                  />
                </video>
              )
            } else {
              // No media? Return blank.
              return <></>
            }
          default:
            break
        }
      })()}
    </div>
  )
}
