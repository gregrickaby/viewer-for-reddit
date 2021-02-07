import PropTypes from 'prop-types'
import cleanIframe from '@/functions/cleanIframe'
import Image from 'next/image'

export default function Card(props) {
  const ups = props?.ups.toLocaleString('en')
  const comments = props?.num_comments.toLocaleString('en')

  return (
    <article className="space-y-4">
      <header>
        <h2 className="text-2xl text-center leading-none">
          <a
            href={`https://www.reddit.com${props?.permalink}`}
            dangerouslySetInnerHTML={{__html: props?.title}}
          />
        </h2>
      </header>

      <div className="overflow-hidden">
        {(() => {
          const [source] = props?.preview.images
          // Determine the media type using props?_hint.
          switch (props?.post_hint) {
            case 'image':
              return (
                <a href={props?.url} aria-label={props?.title}>
                  <Image
                    alt={props?.title}
                    className="card-image"
                    height={source?.source?.height}
                    layout="responsive"
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
                  height="640"
                  width="640"
                />
              )
            case 'rich:video':
              return (
                <a
                  aria-label={props?.title}
                  className="card-embed"
                  dangerouslySetInnerHTML={{
                    __html: cleanIframe(props?.media?.oembed.html)
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
                    height="640"
                    width="640"
                  ></video>
                )
              } else {
                // No .gifv?, then just display the thumbnail.
                return (
                  <Image
                    className="card-image"
                    src={props?.thumbnail}
                    alt={props?.title}
                    height="640"
                    width="640"
                  />
                )
              }
            default:
              break
          }
        })()}
      </div>

      <footer className="flex flex-wrap justify-between text-sm">
        <div>&uarr; {ups} up votes</div>
        <div>
          {props?.num_comments >= 1 && (
            <a href={`https://www.reddit.com${props?.permalink}`}>
              {props?.num_comments <= 1
                ? `${comments} comment`
                : `${comments} comments`}
            </a>
          )}
        </div>
      </footer>
    </article>
  )
}

Card.propTypes = {
  media: PropTypes.object,
  num_comments: PropTypes.number,
  permalink: PropTypes.string,
  post_hint: PropTypes.string,
  preview: PropTypes.object,
  secure_media: PropTypes.object,
  thumbnail: PropTypes.string,
  title: PropTypes.string,
  ups: PropTypes.number,
  url: PropTypes.string
}
