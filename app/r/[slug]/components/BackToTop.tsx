'use client'

import {IconArrowUp} from '@tabler/icons-react'
import {useEffect, useState} from 'react'

/**
 * The back to top component.
 */
export default function BackToTop() {
  const [showButton, setShowButton] = useState(false)
  const buttonText = 'Go back to the top of the page'

  useEffect(() => {
    // Handle scroll event.
    const scrollHandler = () => {
      if (window.scrollY > 200) {
        setShowButton(true)
      } else {
        setShowButton(false)
      }
    }

    // Add event listener for scroll.
    window.addEventListener('scroll', scrollHandler)

    // Clean up event listener.
    return () => window.removeEventListener('scroll', scrollHandler)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  if (!showButton) {
    return null
  }

  return (
    <button
      aria-label={buttonText}
      className="button fixed bottom-8 right-6"
      onClick={scrollToTop}
    >
      <IconArrowUp height="32" width="32" />
      <span className="sr-only">{buttonText}</span>
    </button>
  )
}
