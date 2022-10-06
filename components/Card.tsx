import {createStyles} from '@mantine/core'
import {Post} from '~/lib/types'

const useStyles = createStyles((theme) => ({
  card: {
    overflow: 'hidden',
    paddingBottom: theme.spacing.xl
  },
  image: {
    height: 'auto',
    width: '100%'
  },
  video: {
    height: 'auto',
    width: '100%'
  }
}))

/**
 * Card component.
 */
export default function Card(props: Post) {
  const {classes} = useStyles()
  return (
    <div className={classes.card}>
      {(() => {
        switch (props?.post_hint) {
          case 'image':
            return (
              <a href={props?.permalink}>
                <img
                  alt={props?.title}
                  className={classes.image}
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
                className={classes.video}
                controls
                crossOrigin="anonymous"
                data-hint="hosted:video"
                height={props?.media?.reddit_video?.height}
                playsInline
                poster={props?.images?.url}
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
                className={classes.video}
                controls
                crossOrigin="anonymous"
                data-hint="rich:video"
                height={props?.video_preview?.height}
                muted
                playsInline
                poster={props?.images?.url}
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
                  className={classes.video}
                  controls
                  data-hint="link"
                  muted
                  playsInline
                  poster={props?.images?.url}
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
