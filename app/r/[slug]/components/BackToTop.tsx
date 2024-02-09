'use client'

import {IconArrowUp} from '@tabler/icons-react'
import {useEffect, useState} from 'react'

/**
 * The back to top component.
 */
export default function BackToTop() {
  const [showButton, setShowButton] = useState(false)

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
      onClick={scrollToTop}
      className="button fixed bottom-8 right-8"
      aria-label="Back to top"
    >
      <IconArrowUp height="24" width="24" />
    </button>
  )
}
