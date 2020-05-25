import PropTypes from 'prop-types'
import Img from 'react-cool-img'

const Card = (props) => {
  const post = props.data.data
  return (
    <article className="p-4 border border-solid ">
      <header className="flex space-around justify-between items-center">
        <h2 className="text-2xl mb-4">
          <a
            className="hover:underline"
            href={post.url}
            dangerouslySetInnerHTML={{__html: post.title}}
          />
        </h2>

        <div className="flex space-x-2">
          <span>{post.ups}&uarr;</span>
          <span>{post.downs}&darr;</span>
        </div>
      </header>

      {post.thumbnail.length > 0 && (
        <a href={post.url}>
          <Img
            className="object-cover object-center"
            src={post.url}
            alt={post.title}
          />
        </a>
      )}
    </article>
  )
}

Card.propTypes = {
  data: PropTypes.object
}

export default Card
