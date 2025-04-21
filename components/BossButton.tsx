'use client'

import {IconDoorExit} from '@tabler/icons-react'
import {useRouter} from 'next/navigation'
import {useEffect, useMemo} from 'react'

/**
 * The boss button component.
 */
export default function BossButton() {
  const router = useRouter()

  // Redirect URL and button text
  const redirectUrl = useMemo(() => 'https://duckduckgo.com/', [])
  const buttonText = useMemo(
    () =>
      'The boss button. Click or press Escape to quickly navigate to DuckDuckGo.',
    []
  )

  /**
   * Effect for handling keyboard event.
   */
  useEffect(() => {
    const keydownHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        router.push(redirectUrl)
      }
    }

    // Add the keydown event listener.
    window.addEventListener('keydown', keydownHandler)

    // Cleanup the event listener.
    return () => window.removeEventListener('keydown', keydownHandler)
  }, [router, redirectUrl])

  return (
    <button
      aria-label={buttonText}
      className="boss-button fixed top-8 right-6 z-10 hidden md:block"
      onClick={() => router.push(redirectUrl)}
      title={buttonText}
    >
      <IconDoorExit aria-hidden="true" height="32" width="32" />
      <span className="sr-only">{buttonText}</span>
    </button>
  )
}
