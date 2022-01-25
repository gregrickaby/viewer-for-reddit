import PropTypes from 'prop-types'
import cleanIframe from '@/functions/cleanIframe'
import {useSpring, animated} from 'react-spring'

export default function Card(props) {
  const spring = useSpring({to: {opacity: 1}, from: {opacity: 0}})
  return (
    <animated.article style={spring}>
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
    </animated.article>
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
