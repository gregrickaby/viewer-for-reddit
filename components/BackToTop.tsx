'use client'

import {IconArrowUp} from '@tabler/icons-react'
import {useEffect, useState} from 'react'

/**
 * The back to top component.
 */
export default function BackToTop() {
  const [showButton, setShowButton] = useState(false)
  const buttonText = 'Go back to the top of the page'

  // Effect to handle scroll events.
  useEffect(() => {
    // Scroll event handler.
    const scrollHandler = () => {
      setShowButton(window.scrollY > 200)
    }

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
      className="button fixed bottom-8 right-6"
      onClick={scrollToTop}
      title={buttonText}
    >
      <IconArrowUp height="32" width="32" />
      <span className="sr-only">{buttonText}</span>
    </button>
  ) : null
}
