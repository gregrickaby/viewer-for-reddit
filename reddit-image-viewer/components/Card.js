import PropTypes from 'prop-types'
import Img from 'react-cool-img'
import {cleanIframe} from '@/lib/functions'

export default function Card(props) {
  const post = props.data.data
  const date = new Date(post.created_utc * 1000)

  return (
    <article className="card">
      <header className="card-header">
        <h2 className="card-title">
          <a
            className="card-link"
            href={`https://www.reddit.com${post.permalink}`}
            dangerouslySetInnerHTML={{__html: post.title}}
          />
        </h2>
      </header>

      <div className="card-content">
        {(() => {
          // Determine the media type using post_hint.
          switch (post.post_hint) {
            case 'image':
              return (
                <a href={post.url}>
                  <Img
                    alt={post.title}
                    className="card-image"
                    debounce={500}
                    error="error.png"
                    src={post.url}
                    placeholder="loading.svg"
                    height="512"
                    width="512"
                  />
                </a>
              )
            case 'hosted:video':
              return (
                // eslint-disable-next-line
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
                  // eslint-disable-next-line
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
                  <Img
                    className="card-image"
                    src={post.thumbnail}
                    alt={post.title}
                  />
                )
              }
            default:
              break
          }
        })()}
      </div>

      <footer className="card-footer">
        <div className="card-date">
          By <code>{post.author}</code> on{' '}
          <time>
            {date.getMonth() + 1}/{date.getDate()}/
            {date.getFullYear().toString().slice(-2)}
          </time>
        </div>
        <div className="card-votes">&uarr; {post.ups}</div>
        <div className="card-comments">
          <a href={`https://www.reddit.com${post.permalink}`}>
            {post.num_comments} comments
          </a>
        </div>
      </footer>
    </article>
  )
}

Card.propTypes = {
  data: PropTypes.object
}
