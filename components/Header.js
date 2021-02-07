import PropTypes from 'prop-types'

export default function Header({title, description}) {
  return (
    <header className="text-center space-y-4">
      <h1 className="text-4xl font-bold">{title}</h1>
      <p>{description}</p>
    </header>
  )
}

Header.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired
}
