import {useState, useEffect} from 'react'
import CorsMessage from './CorsMessage'

export default function Spinner() {
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
      <img src="loading.svg" alt="loading" height="50" width="50" />
      {seconds > 5 && <CorsMessage />}
    </div>
  )
}
