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
  const redirectUrl = 'https://duckduckgo.com/'
  const buttonText =
    'The boss button. Click or press Escape to quickly navigate to DuckDuckGo.'

  /**
   * Effect for showing the boss button.
   */
  useEffect(() => {
    // On initial load, show the button if the viewport is wider than 768px.
    setShowButton(window.innerWidth > 768)

    // Handle viewport changes.
    const resizeHandler = () => {
      setShowButton(window.innerWidth > 768)
    }

    // Handle the keydown event.
    const keydownHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        router.push(redirectUrl)
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
      onClick={() => router.push(redirectUrl)}
      title={buttonText}
    >
      <IconDoorExit aria-hidden="true" height="32" width="32" />
      <span className="sr-only">{buttonText}</span>
    </button>
  ) : null
}
