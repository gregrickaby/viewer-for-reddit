const Card = (props) => {
  const post = props.data.data;
  return (
    <article className="card">
      {post.thumbnail.length > 0 && (
        <img src={post.thumbnail} alt={post.title} />
      )}
      <h2>
        <a href={post.url}>{post.title}</a>
      </h2>
      <p dangerouslySetInnerHTML={{ __html: post.selftext }} />
      <span>{post.ups}</span>
    </article>
  );
};

export default Card;
