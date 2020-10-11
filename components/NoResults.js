import Img from 'react-cool-img'

export default function NoResults() {
  return (
    <div className="no-results">
      <p>No posts found...</p>
      <Img className="no-results-image" src="/not-found.webp" />
    </div>
  )
}
