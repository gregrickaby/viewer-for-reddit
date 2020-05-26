import PropTypes from 'prop-types'
import Img from 'react-cool-img'

const Card = (props) => {
  const post = props.data.data
  const date = new Date(post.created_utc * 1000)

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
        {post.thumbnail.length > 0 && (
          <a href={post.url}>
            <Img className="card-image" src={post.url} alt={post.title} />
          </a>
        )}
      </div>

      <footer className="card-footer">
        <div className="card-date">
          Posted on {date.getMonth()}/{date.getDate()}/
          {date.getFullYear().toString().slice(-2)}
        </div>
        <div className="card-votes">&uarr; {post.ups}</div>
        <div className="card-comments">{post.num_comments} comments</div>
      </footer>
    </article>
  )
}

Card.propTypes = {
  data: PropTypes.object
}

export default Card
