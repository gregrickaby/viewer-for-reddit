import {createStyles} from '@mantine/core'
import {cleanIframe} from '~/lib/helpers'

const useStyles = createStyles((theme) => ({
  card: {
    overflow: 'hidden',
    paddingBottom: theme.spacing.xl
  },
  img: {
    height: 'auto',
    width: '100%'
  }
}))

/**
 * Card component.
 */
export default function Card(props) {
  const {classes} = useStyles()
  return (
    <div className={classes.card}>
      {(() => {
        switch (props?.type) {
          case 'image':
            return (
              <a href={props?.permalink} aria-label={props?.title}>
                <img
                  alt={props?.title}
                  className={classes.img}
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
                autoPlay
                controls
                loop
                muted
                playsInline
                src={props?.secure_media?.reddit_video?.fallback_url}
              />
            )
          case 'rich:video':
            return (
              <a
                aria-label={props?.title}
                dangerouslySetInnerHTML={{
                  __html: cleanIframe({
                    html: props?.media?.oembed?.html
                  })
                }}
                href={props?.url}
              />
            )
          case 'link':
            // Search for .gifv....
            if (props?.url.includes('gifv')) {
              return (
                <video
                  autoPlay
                  controls
                  loop
                  muted
                  playsInline
                  src={props?.url.replace('.gifv', '.mp4')} // Replace .gifv with .mp4.
                ></video>
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
