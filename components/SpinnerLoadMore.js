import PropTypes from 'prop-types'
import Loader from 'react-loader-spinner'
import 'react-loader-spinner/dist/loader/css/react-spinner-loader.css'

export default function SpinnerLoadMore(props) {
  const {elementRef, loading} = props
  return (
    <div ref={elementRef} className="loadingMore">
      <div
        style={{
          display: loading ? 'block' : 'none',
          width: '80px',
          margin: '0 auto'
        }}
      >
        <Loader type="ThreeDots" color="#72cbfd" height={80} width={80} />
      </div>
    </div>
  )
}

SpinnerLoadMore.propTypes = {
  elementRef: PropTypes.oneOfType([
    PropTypes.func,
    PropTypes.shape({current: PropTypes.any})
  ]),
  loading: PropTypes.bool
}
