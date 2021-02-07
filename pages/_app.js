import PropTypes from 'prop-types'
import 'styles/index.css'
import 'styles/global.css'

export default function App({Component, pageProps}) {
  return <Component {...pageProps} />
}

App.propTypes = {
  Component: PropTypes.any.isRequired,
  pageProps: PropTypes.object.isRequired
}
