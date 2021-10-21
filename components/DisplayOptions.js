import cn from 'classnames'
import {useEffect, useState} from 'react'

export default function DisplayOptions() {
  const [fontFamily, setFontFamily] = useState('font-sans')
  const [fontSelector, toggleFontSelector] = useState(false)

  function clearFonts() {
    document.body.classList.remove(
      'font-sans',
      'font-mono',
      'font-serif',
      'font-comic',
      'font-dyslexic'
    )
  }

  function toggleDisplayOptions(event) {
    event.preventDefault()
    toggleFontSelector((prev) => !prev)
  }

  function changeFont(event) {
    event.preventDefault()
    clearFonts()
    setFontFamily(event?.target?.value)
    document.body.classList.add(event?.target?.value)
    localStorage.setItem('font', event?.target?.value)
    toggleFontSelector(false)
  }

  function setFontOnLoad() {
    const font = localStorage.getItem('font')
    const validateFont = font?.length ? font : ''
    if (validateFont) {
      setFontFamily(validateFont)
      clearFonts()
      document.body.classList.add(validateFont)
    }
  }

  useEffect(() => {
    setFontOnLoad()
  }, []) /* eslint-disable-line */

  return (
    <div
      className={cn('flex items-center fixed top-0 right-0 p-2', {
        'dark:bg-gray-900 bg-white': fontSelector
      })}
    >
      <form onSubmit={toggleDisplayOptions}>
        <label htmlFor="display" className="sr-only">
          toggle display options
        </label>
        <button id="display" className="bg-transparent px-2">
          {fontSelector ? 'X' : 'Aa'}
        </button>
      </form>

      {fontSelector && (
        <div className="flex ml-2">
          <select
            id="fontSelect"
            className="p-2 dark:text-gray-900"
            value={fontFamily}
            onChange={changeFont}
          >
            <option value="font-sans">sans-serif</option>
            <option value="font-serif">serif</option>
            <option value="font-mono">monospace</option>
            <option value="font-comic">comic sans</option>
            <option value="font-dyslexic">open dyslexic</option>
          </select>
        </div>
      )}
    </div>
  )
}
