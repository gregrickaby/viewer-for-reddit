import Img from 'react-cool-img'

const NoResults = () => (
  <div className="no-results">
    <p>No posts found...</p>
    <Img
      className="no-results-image"
      src="https://media.giphy.com/media/h3v63bGeVb1pdgFtTx/giphy.gif"
    />
    <p className="italic text-sm">
      Note: If you&apos;re unable to see anything, it&apos;s probably because of{' '}
      <a
        className="underline"
        href="https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS"
      >
        CORS
      </a>
      . Try turning off tracking protection and/or any ad blocker extensions.
    </p>
  </div>
)

export default NoResults
