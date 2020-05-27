import PropTypes from 'prop-types'
import Img from 'react-cool-img'

const Card = (props) => {
  const post = props.data.data
  const date = new Date(post.created_utc * 1000)

  // Reddit encodes HTML, so decode it before using dangerouslySetInnerHTML.
  // https://gomakethings.com/decoding-html-entities-with-vanilla-javascript/
  const decodeHTML = (html) => {
    const text = document.createElement('textarea') // eslint-disable-line no-undef
    text.innerHTML = html
    return text.value
  }

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
          // Determin the media type using post_hint.
          switch (post.post_hint) {
            case 'image':
              return (
                <a href={post.url}>
                  <Img className="card-image" src={post.url} alt={post.title} />
                </a>
              )
            case 'hosted:video':
              return (
                // eslint-disable-next-line
                <video
                  src={post.secure_media.reddit_video.fallback_url}
                  controls
                  muted
                ></video>
              )
            case 'rich:video':
              return (
                <a
                  src={post.url}
                  className="card-embed"
                  dangerouslySetInnerHTML={{
                    __html: decodeHTML(post.media.oembed.html)
                  }}
                />
              )
            case 'link':
              // Search for .gifv....
              if (post.url.includes('gifv')) {
                return (
                  // eslint-disable-next-line
                  <video
                    src={post.url.replace('.gifv', '.mp4')} // Replace .gifv with .mp4.
                    controls
                    muted
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
              break
            default:
              break
          }
        })()}
      </div>

      <footer className="card-footer">
        <div className="card-date">
          By <code>{post.author}</code> on{' '}
          <time>
            {date.getMonth()}/{date.getDate()}/
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

export default Card
