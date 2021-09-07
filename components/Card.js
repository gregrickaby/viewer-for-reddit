import PropTypes from 'prop-types'
import cleanIframe from '@/functions/cleanIframe'

export default function Card(post) {
  const ups = post?.ups.toLocaleString('en')
  const comments = post?.num_comments.toLocaleString('en')

  return (
    <article className="space-y-4">
      <header>
        <h2 className="text-2xl text-center">
          <a
            href={`https://www.reddit.com${post?.permalink}`}
            dangerouslySetInnerHTML={{__html: post?.title}}
          />
        </h2>
      </header>

      <div className="overflow-hidden">
        {(() => {
          const [images] = post?.preview?.images

          // Determine the media type using post?_hint.
          switch (post?.post_hint) {
            case 'image':
              return (
                <a href={post?.url} aria-label={post?.title}>
                  <img
                    alt={post?.title}
                    className="card-image"
                    height={images?.resolutions[3]?.height}
                    loading="lazy"
                    src={images?.resolutions[3]?.url}
                    width={images?.resolutions[3]?.width}
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
                  src={post?.secure_media?.reddit_video?.fallback_url}
                  height="480"
                  width="640"
                />
              )
            case 'rich:video':
              return (
                <a
                  aria-label={post?.title}
                  dangerouslySetInnerHTML={{
                    __html: cleanIframe({
                      height: post?.media?.oembed?.height,
                      html: post?.media?.oembed?.html,
                      width: post?.media?.oembed?.width
                    })
                  }}
                  href={post?.url}
                />
              )
            case 'link':
              // Search for .gifv....
              if (post?.url.includes('gifv')) {
                return (
                  <video
                    className="card-video"
                    autoPlay
                    controls
                    loop
                    muted
                    playsInline
                    src={post?.url.replace('.gifv', '.mp4')} // Replace .gifv with .mp4.
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

      <footer className="flex flex-wrap justify-between text-sm pb-4">
        <div>&uarr; {ups} up votes</div>
        <div>
          {post?.num_comments >= 1 && (
            <a href={`https://www.reddit.com${post?.permalink}`}>
              {post?.num_comments <= 1
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
