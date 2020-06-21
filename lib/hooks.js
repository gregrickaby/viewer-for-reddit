import {useEffect, useState} from 'react'

/**
 * debounce any fast changing value
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

/**
 * Sync state to local storage so that it persists through a page refresh.
 *
 * @url https://usehooks.com/useLocalStorage/
 * @param {string}  key           A name for the value being stored.
 * @param {string}  initialValue  The initial data being stored.
 * @return {array}                The stored data and the set value.
 */
export function useLocalStorage(key, initialValue) {
  // Pass initial state function to useState so logic is only executed once.
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key) // eslint-disable-line no-undef
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.log(error)
      return initialValue
    }
  })

  // Return a wrapped version of useState's setter function that.
  const setValue = (value) => {
    try {
      // Allow value to be a function so we have same API as useState
      const valueToStore =
        value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)
      window.localStorage.setItem(key, JSON.stringify(valueToStore)) // eslint-disable-line no-undef
    } catch (error) {
      console.log(error)
    }
  }

  return [storedValue, setValue]
}
