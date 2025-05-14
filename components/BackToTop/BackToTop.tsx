'use client'

import {debounce} from '@/lib/functions'
import {useEffect, useMemo, useState} from 'react'
import {FaArrowUp} from 'react-icons/fa'

/**
 * The back to top component.
 */
export default function BackToTop() {
  const [showButton, setShowButton] = useState(false)
  const buttonText = useMemo(() => 'Go back to the top of the page', [])

  /**
   * Effect for showing the back to top button.
   */
  useEffect(() => {
    // Scroll event handler.
    const scrollHandler = debounce(() => {
      setShowButton(window.scrollY > 200)
    }, 200)

    // Add event listener.
    window.addEventListener('scroll', scrollHandler)

    // Cleanup event listener.
    return () => window.removeEventListener('scroll', scrollHandler)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  return showButton ? (
    <button
      aria-label={buttonText}
      className="button fixed right-6 bottom-8"
      onClick={scrollToTop}
      title={buttonText}
    >
      <FaArrowUp height="32" width="32" />
      <span className="sr-only">{buttonText}</span>
    </button>
  ) : null
}
