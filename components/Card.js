import PropTypes from 'prop-types'
import {cleanIframe} from '@/lib/functions'
import Image from 'next/image'

export default function Card(props) {
  const post = props.data.data
  const ups = post.ups.toLocaleString('en')
  const comments = post.num_comments.toLocaleString('en')

  return (
    <article className="card">
      <header className="card-header">
        <h2 className="card-title">
          <a
            className="card-link"
            href={`https://www.reddit.com${post.permalink}`}
            dangerouslySetInnerHTML={{__html: post.title}}
          />{' '}
        </h2>
      </header>

      <div className="card-content">
        {(() => {
          const [source] = post.preview.images
          // Determine the media type using post_hint.
          switch (post.post_hint) {
            case 'image':
              return (
                <a href={post.url}>
                  <Image
                    alt={post.title}
                    className="card-image"
                    height={source.source.height}
                    layout="responsive"
                    src={post.url}
                    width={source.source.width}
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
                  src={post.secure_media.reddit_video.fallback_url}
                  height="512"
                  width="512"
                />
              )
            case 'rich:video':
              return (
                <a
                  src={post.url}
                  className="card-embed"
                  dangerouslySetInnerHTML={{
                    __html: cleanIframe(post.media.oembed.html)
                  }}
                />
              )
            case 'link':
              // Search for .gifv....
              if (post.url.includes('gifv')) {
                return (
                  <video
                    className="card-video"
                    autoPlay
                    controls
                    loop
                    muted
                    playsInline
                    src={post.url.replace('.gifv', '.mp4')} // Replace .gifv with .mp4.
                    height="512"
                    width="512"
                  ></video>
                )
              } else {
                // No .gifv?, then just display the thumbnail.
                return (
                  <Image
                    className="card-image"
                    src={post.thumbnail}
                    alt={post.title}
                    height="150"
                    width="150"
                  />
                )
              }
            default:
              break
          }
        })()}
      </div>

      <footer className="card-footer">
        <div className="card-votes">&uarr; {ups} ups</div>
        <div className="card-comments">
          {post.num_comments >= 1 && (
            <a href={`https://www.reddit.com${post.permalink}`}>
              {post.num_comments <= 1
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
  data: PropTypes.object
}
