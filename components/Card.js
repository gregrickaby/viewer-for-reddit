import PropTypes from 'prop-types'
import cleanIframe from '@/functions/cleanIframe'

export default function Card(props) {
  return (
    <article>
      <div className="overflow-hidden">
        {(() => {
          const [source] = props.images || []
          switch (props?.type) {
            case 'image':
              return (
                <a href={props?.permalink} aria-label={props?.title}>
                  <img
                    alt={props?.title}
                    className="card-image"
                    height={source?.source?.height}
                    loading="lazy"
                    src={props?.url}
                    width={source?.source?.width}
                  />
                </a>
              )
            case 'hosted:video':
              return (
                <video
                  className="card-video"
                  autoPlay
                  controls
                  loop
                  muted
                  playsInline
                  src={props?.secure_media?.reddit_video?.fallback_url}
                  height="480"
                  width="640"
                />
              )
            case 'rich:video':
              return (
                <a
                  aria-label={props?.title}
                  dangerouslySetInnerHTML={{
                    __html: cleanIframe({
                      height: props?.media?.oembed?.height,
                      html: props?.media?.oembed?.html,
                      width: props?.media?.oembed?.width
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
                    className="card-video"
                    autoPlay
                    controls
                    loop
                    muted
                    playsInline
                    src={props?.url.replace('.gifv', '.mp4')} // Replace .gifv with .mp4.
                    height="480"
                    width="640"
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
    </article>
  )
}

Card.propTypes = {
  media: PropTypes.object,
  nsfw: PropTypes.bool,
  comments: PropTypes.number,
  permalink: PropTypes.string,
  preview: PropTypes.object,
  secure_media: PropTypes.object,
  images: PropTypes.array,
  thumbnail: PropTypes.string,
  title: PropTypes.string,
  type: PropTypes.string,
  upvotes: PropTypes.number,
  url: PropTypes.string
}
