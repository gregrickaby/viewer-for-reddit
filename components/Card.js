import PropTypes from 'prop-types'
import cleanIframe from '@/functions/cleanIframe'

export default function Card(props) {
  return (
    <div className="overflow-hidden pb-4">
      {(() => {
        switch (props?.type) {
          case 'image':
            return (
              <a href={props?.permalink} aria-label={props?.title}>
                <img
                  alt={props?.title}
                  className="card-image"
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
                className="aspect-video w-full"
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
                  className="aspect-video w-full"
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

Card.propTypes = {
  images: PropTypes.array,
  media: PropTypes.object,
  permalink: PropTypes.string,
  preview: PropTypes.object,
  secure_media: PropTypes.object,
  thumbnail: PropTypes.string,
  title: PropTypes.string,
  type: PropTypes.string,
  ups: PropTypes.number,
  url: PropTypes.string
}
