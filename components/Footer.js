import PropTypes from 'prop-types'

export default function Footer({author, url}) {
  return (
    <footer className="py-4 text-center font-mono text-xs">
      <p>
        website by{' '}
        <a href={url} rel="noopener">
          {author}
        </a>
      </p>
    </footer>
  )
}

Footer.propTypes = {
  author: PropTypes.string.isRequired,
  url: PropTypes.string.isRequired
}
