import {useEffect, useState} from 'react'

/**
 * Determine and return scroll position.
 *
 * @return {integer} The current scroll position in pixels.
 */
export function useScrollPosition() {
  const [scrollPosition, setScrollPosition] = useState(0)
  /* eslint-disable */
  useEffect(() => {
    const handleScroll = () => {
      setScrollPosition(window.pageYOffset)
    }

    window.addEventListener('scroll', handleScroll, {passive: true})

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])
  /* eslint-enable */
  return scrollPosition
}

/**
 * Debounce any fast changing value
 *
 * @url https://usehooks.com/useDebounce/
 * @param {string}  value  Any string to use
 * @param {integer} delay  A value in milliseconds
 * @return {integer}       The amount of delay.
 */
export function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)
    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}
