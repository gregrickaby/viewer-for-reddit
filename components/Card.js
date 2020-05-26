import PropTypes from 'prop-types'
import Img from 'react-cool-img'

const Card = (props) => {
  const post = props.data.data
  const date = new Date(post.created_utc * 1000)
  const permalink = `https://www.reddit.com${post.permalink}`

  return (
    <article className="card">
      <header className="card-header">
        <h2 className="card-title">
          <a
            className="card-link"
            href={post.url}
            dangerouslySetInnerHTML={{__html: post.title}}
          />
        </h2>
      </header>

      <div className="card-content">
        {(() => {
          // Determin the media type using post_hint
          switch (post.post_hint) {
            case 'image':
              return (
                <Img className="card-image" src={post.url} alt={post.title} />
              )
            case 'hosted:video':
              return (
                <video
                  src={post.secure_media.reddit_video.fallback_url}
                  autoPlay="true"
                ></video>
              )
            case 'rich:video':
              return (
                <div
                  dangerouslySetInnerHTML={{__html: post.media_embed.content}}
                />
              )
            case 'self':
              return ''
            case 'link':
              return ''
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
          <a href={permalink}>{post.num_comments} comments</a>
        </div>
      </footer>
    </article>
  )
}

Card.propTypes = {
  data: PropTypes.object
}

export default Card
