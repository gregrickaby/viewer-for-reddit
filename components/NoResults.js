import Img from 'react-cool-img'

export default function NoResults() {
  return (
    <div className="no-results">
      <p>No posts found...</p>
      <Img
        className="no-results-image"
        src="https://media.giphy.com/media/h3v63bGeVb1pdgFtTx/giphy.gif"
      />
    </div>
  )
}
