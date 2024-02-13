'use client'

import {IconDoorExit} from '@tabler/icons-react'
import {useRouter} from 'next/navigation'
import {useEffect, useState} from 'react'

/**
 * The boss button component.
 */
export default function BossButton() {
  const [showButton, setShowButton] = useState(false)
  const router = useRouter()
  const buttonText =
    'The boss button. Click or press Escape to quickly navigate to DuckDuckGo.'

  // Effect for the boss button.
  useEffect(() => {
    // On initial load, show the button if the viewport is wider than 768px.
    if (window.innerWidth > 768) {
      setShowButton(true)
    }

    // Handle viewport changes.
    const resizeHandler = () => {
      if (window.innerWidth > 768) {
        setShowButton(true)
      } else {
        setShowButton(false)
      }
    }

    // Handle the keydown event.
    const keydownHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        router.push('https://duckduckgo.com/')
      }
    }

    // Add event listeners.
    window.addEventListener('keydown', keydownHandler)
    window.addEventListener('resize', resizeHandler)

    // Cleanup the event listeners.
    return () => {
      window.removeEventListener('keydown', keydownHandler)
      window.removeEventListener('resize', resizeHandler)
    }
  }, [router])

  return showButton ? (
    <button
      aria-label={buttonText}
      className="fixed right-6 top-8 z-10"
      onClick={() => router.push('https://duckduckgo.com/')}
      title={buttonText}
    >
      <IconDoorExit aria-hidden="true" height="32" width="32" />
    </button>
  ) : null
}
