'use client'

import {IconDoorExit} from '@tabler/icons-react'
import {useRouter} from 'next/navigation'
import {useEffect} from 'react'

/**
 * The boss button component.
 */
export default function BossButton() {
  const router = useRouter()
  const buttonText =
    'The boss button. Click or press Escape to quickly navigate to DuckDuckGo.'

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        router.push('https://duckduckgo.com/')
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [router])

  return (
    <button
      aria-label={buttonText}
      className="tooltip-container button fixed right-8 top-8 z-50"
      onClick={() => router.push('https://duckduckgo.com/')}
    >
      <IconDoorExit aria-hidden="true" height="32" width="32" />
      <span className="tooltip-text">{buttonText}</span>
    </button>
  )
}
