import {useState, useEffect} from 'react'
import CorsMessage from './CorsMessage'

const Spinner = () => {
  const [seconds, setSeconds] = useState(1)

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds(seconds + 1)
    }, 1000)
    return () => clearInterval(timer)
  })

  return (
    <div className="spinner">
      <p>Loading sub...</p>
      <div className="sp sp-clock"></div>
      {seconds > 5 && <CorsMessage />}
    </div>
  )
}

export default Spinner
