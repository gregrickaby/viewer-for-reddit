import PropTypes from 'prop-types'
import Img from 'react-cool-img'

const Card = (props) => {
  const post = props.data.data
  return (
    <article className="w-full  bg-gray-400">
      <h2>
        <a href={post.url}>{post.title}</a>
      </h2>
      {post.thumbnail.length > 0 && (
        <Img src={post.thumbnail} alt={post.title} />
      )}
      <p dangerouslySetInnerHTML={{__html: post.selftext}} />
      <span>{post.ups}</span>
      <span>{post.downs}</span>
    </article>
  )
}

Card.propTypes = {
  data: PropTypes.object
}

export default Card
