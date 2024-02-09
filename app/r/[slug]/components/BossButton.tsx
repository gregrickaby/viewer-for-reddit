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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        router.push('https://duckduckgo.com/')
      }
    }

    const handleScroll = () => {
      if (window.scrollY > 50) {
        setShowButton(true)
      } else {
        setShowButton(false)
      }
    }

    window.addEventListener('scroll', handleScroll)
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [router])

  return (
    <button
      aria-label={buttonText}
      className={`fixed right-6 top-8 z-10 ${showButton ? 'block' : 'hidden'} md:block`}
      onClick={() => router.push('https://duckduckgo.com/')}
    >
      <IconDoorExit aria-hidden="true" height="32" width="32" />
      <span className="tooltip-text sr-only">{buttonText}</span>
    </button>
  )
}
